import { GoogleGenAI, Type } from "@google/genai";
import type { NewsArticle, GraphData, VerificationResult, EntityDossier, IntelligencePackage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const newsGenerationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING, description: 'A compelling, fact-based news headline in Persian.' },
      summary: { type: Type.STRING, description: 'A one-sentence summary of the news in Persian, identifying the main entity.' },
      topic: { type: Type.STRING, description: 'The primary topic in Persian (e.g., فناوری, سیاست, علم).' },
      region: { type: Type.STRING, description: 'The geographical region of the news in Persian (e.g., آمریکای شمالی, اروپا, آسیا).' },
      sentiment: { type: Type.STRING, description: 'The sentiment of the news: Positive, Negative, or Neutral (in English).' },
      source_name: { type: Type.STRING, description: 'The simulated source name in Persian (e.g., "سیمای جمهوری اسلامی", "توییتر").' },
      credibility_score: { type: Type.NUMBER, description: 'An estimated credibility score from 0 to 100.' },
      timestamp: { type: Type.STRING, description: 'The simulated publication timestamp as a recent ISO 8601 string.'}
    },
    required: ['headline', 'summary', 'topic', 'region', 'sentiment', 'source_name', 'credibility_score', 'timestamp'],
  },
};

const graphGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            description: "A list of unique entities and topics from the news in Persian.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "The unique name of the node (entity or topic) in Persian." },
                    group: { type: Type.STRING, description: "The type of the node, e.g., 'موضوع', 'شخص', 'سازمان', 'مکان'." },
                    sentiment: { type: Type.STRING, description: "The overall sentiment ('Positive', 'Negative', 'Neutral' in English) for Person or Organization nodes, based on context." }
                },
                required: ['id', 'group']
            }
        },
        links: {
            type: Type.ARRAY,
            description: "A list of connections between nodes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING, description: "The id of the source node." },
                    target: { type: Type.STRING, description: "The id of the target node." },
                    value: { type: Type.NUMBER, description: "The strength of the connection, typically 1." }
                },
                required: ['source', 'target', 'value']
            }
        }
    },
    required: ['nodes', 'links']
};

const intelligencePackageSchema = {
    type: Type.OBJECT,
    properties: {
        news_stream: newsGenerationSchema,
        connections_graph: graphGenerationSchema,
    },
    required: ['news_stream', 'connections_graph'],
};


const entityDossierSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief summary of the entity's role in recent events in Persian." },
        connections: {
            type: Type.ARRAY,
            description: "A list of key entities it is connected to in Persian.",
            items: { type: Type.STRING }
        },
        sentiment_analysis: {
            type: Type.OBJECT,
            properties: {
                overall: { type: Type.STRING, description: "A nuanced overall sentiment (e.g., 'عموما مثبت', 'بحث‌برانگیز')." },
                positive_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific positive aspects observed." },
                negative_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific negative aspects observed." },
                confidence_score: { type: Type.STRING, description: "Confidence in this analysis: 'High', 'Medium', 'Low'." },
                reasoning: { type: Type.STRING, description: "Reasoning for the sentiment and confidence score." }
            },
            required: ['overall', 'positive_points', 'negative_points', 'confidence_score', 'reasoning']
        }
    },
    required: ['summary', 'connections', 'sentiment_analysis']
};

// --- Utility for API Retries ---
const withRetry = async <T>(apiCall: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await apiCall();
        } catch (error) {
            const e = error as any;
            // Only retry on rate limit (429) or server errors (5xx)
            if (e.message.includes('429') || (e.status >= 500 && e.status <= 599)) {
                attempt++;
                if (attempt >= retries) {
                    throw error; // Rethrow after final attempt
                }
                const delay = initialDelay * Math.pow(2, attempt - 1);
                const jitter = delay * 0.2 * Math.random(); // Add jitter
                console.warn(`API call failed, retrying in ${Math.round(delay + jitter)}ms... (Attempt ${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay + jitter));
            } else {
                // For other errors (e.g., 400 Bad Request), don't retry
                throw error;
            }
        }
    }
    // This line should not be reachable, but is required for TypeScript
    throw new Error('Unreachable code in withRetry');
};


export const generateIntelligencePackage = async (activeFeeds: string[]): Promise<IntelligencePackage> => {
    return withRetry(async () => {
        const feedTopics = activeFeeds.length > 0 ? activeFeeds.join(', ') : 'رویدادهای جهانی';
        const prompt = `به عنوان یک تحلیلگر اطلاعاتی نخبه (Elite Intelligence Analyst) برای یک پلتفرم پیشرفته عمل کن. وظیفه تو تولید یک بسته اطلاعاتی کامل به زبان فارسی است. این بسته شامل دو بخش کلیدی است که باید با دقت بالا تولید شوند:

بخش ۱: تولید جریان خبری (News Stream)
یک لیست متنوع از ۱۰ آیتم خبری بسیار اخیر (در چند ساعت گذشته) بر اساس این حوزه‌های اطلاعاتی تولید کن: ${feedTopics}.
برای هر آیتم، این قوانین را به دقت رعایت کن:
- **سرفصل (headline):** باید کاملاً مبتنی بر واقعیت، قابل تأیید و با لحنی بی‌طرفانه نوشته شود.
- **خلاصه (summary):** باید یک جمله موجز و دقیق باشد که نه تنها رویداد اصلی را بیان می‌کند، بلکه به اهمیت و پیامدهای آن نیز اشاره دارد و بازیگران اصلی را مشخص می‌کند.
- **احساسات (sentiment):** باید لحن کلی گزارش در مورد رویداد را منعکس کند. برای رویدادهای پیچیده یا بحث‌برانگیز، از 'Neutral' استفاده کن.
- **منبع و اعتبار (source_name & credibility_score):** نام منبع باید برای خبر مورد نظر قابل قبول باشد (مثلاً یک خبرگزاری رسمی در مقابل یک شایعه در شبکه‌های اجتماعی). امتیاز اعتبار باید منعکس‌کننده ماهیت منبع باشد (امتیاز بالا برای منابع معتبر، امتیاز پایین‌تر برای منابع تأییدنشده).

بخش ۲: تولید گراف ارتباطات (Connections Graph)
بر اساس و **منحصراً بر اساس** آیتم‌های خبری که در بخش ۱ تولید کردی، یک گراف دانش بساز.
برای ساخت گراف، این اصول را به شدت دنبال کن:
- **ایجاد گره‌ها (Nodes):** تمام موجودیت‌های کلیدی (اشخاص، سازمان‌ها، مکان‌ها) و موضوعات اصلی از اخبار را به عنوان گره تعریف کن. احساسات گره‌های شخص و سازمان باید منعکس‌کننده تصویر کلی آن‌ها در تمام اخبار مرتبط در این بسته باشد.
- **ایجاد پیوندها (Links):** پیوندها باید نشان‌دهنده یک **تعامل مستقیم، معنادار و گزارش‌شده** باشند. از ایجاد پیوندهای ضعیف یا مبتنی بر حضور همزمان در یک خبر خودداری کن.
    - نمونه‌هایی از تعامل مستقیم: یک جلسه دیپلماتیک، یک قرارداد تجاری، یک اتهام عمومی، یک عملیات مشترک.
    - هر موجودیت باید به **موضوع اصلی** خبر مرتبط با خود نیز پیوند داشته باشد.
- **یکپارچگی گراف:** اطمینان حاصل کن که هر گره‌ای که در یک پیوند استفاده می‌شود، در لیست گره‌ها وجود دارد.

خروجی نهایی باید یک شیء JSON واحد باشد که به طور دقیق با اسکیمای ارائه‌شده مطابقت دارد و شامل 'news_stream' و 'connections_graph' است.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: intelligencePackageSchema,
            },
        });

        const data = JSON.parse(response.text);

        const articles: NewsArticle[] = data.news_stream.map((item: Omit<NewsArticle, 'id'>, index: number) => ({
            ...item,
            id: `${new Date(item.timestamp).getTime()}-${index}`
        }));

        const graph: GraphData = data.connections_graph;

        if (!articles || !graph || !graph.nodes || !graph.links) {
            throw new Error("ساختار داده نامعتبر از هوش مصنوعی دریافت شد.");
        }
        
        return { articles, graph };
    });
};


export const verifyNews = async (article: NewsArticle): Promise<VerificationResult> => {
    return withRetry(async () => {
        const prompt = `به عنوان یک حقیقت‌سنج (Fact-Checker) بی‌طرف و دقیق عمل کن. این ادعای خبری را به فارسی تحلیل کن:
سرفصل: "${article.headline}"
خلاصه: "${article.summary}"

وظیفه تو این است:
۱. یک تحلیل کوتاه و یک‌پاراگرافی از صحت و زمینه احتمالی این خبر ارائه بده. اعتبار ادعا را بسنج، به دنبال الگوهای رایج اطلاعات نادرست بگرد و یک نتیجه‌گیری متعادل ارائه کن.
۲. با استفاده از جستجوی وب، منابع معتبری برای تأیید یا رد این خبر پیدا کن.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const analysis = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return { analysis, sources };
    });
};

export const generateDailyBriefing = async (articlesContext: string): Promise<string> => {
    return withRetry(async () => {
        if (!articlesContext) {
            return "مقاله‌ای برای تهیه گزارش وجود ندارد.";
        }
        const prompt = `به عنوان یک استراتژیست ارشد اطلاعات، یک گزارش اطلاعاتی روزانه (Daily Briefing) به زبان فارسی تهیه کن. ورودی تو لیستی از سرفصل‌های خبری امروز است:
${articlesContext}

تحلیل تو باید یک تحلیل ترکیبی (synthesis) سطح بالا باشد، نه فقط یک خلاصه.
- **روندهای کلیدی:** مهم‌ترین روندهای در حال ظهور را شناسایی کن.
- **ارتباطات پنهان:** نقاط اتصال بین رویدادهای به ظاهر نامرتبط را پیدا کن و توضیح بده که چگونه بر یکدیگر تأثیر می‌گذارند.
- **تحلیل پیامدها:** پیامدهای بالقوه مهم‌ترین رویدادها را تحلیل کن.
- **ساختار گزارش:** گزارش باید دارای یک مقدمه جذاب، بدنه‌ای تحلیلی و یک نتیجه‌گیری استراتژیک باشد.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        return response.text;
    });
};

export const generateEntityDossier = async (entityId: string, allArticles: NewsArticle[]): Promise<EntityDossier> => {
    return withRetry(async () => {
        const relevantArticles = allArticles.filter(article =>
            article.headline.includes(entityId) || article.summary.includes(entityId)
        );

        if (relevantArticles.length === 0) {
            return {
                summary: `هیچ اطلاعات مستقیمی در مورد "${entityId}" در جریان خبری فعلی یافت نشد.`,
                connections: [],
                sentiment_analysis: {
                    overall: 'خنثی',
                    positive_points: [],
                    negative_points: [],
                    confidence_score: 'High',
                    reasoning: 'عدم وجود داده برای تحلیل.'
                }
            };
        }
        
        const context = relevantArticles.map(a => `- ${a.headline}: ${a.summary}`).join('\n');
        const prompt = `به عنوان یک تحلیلگر ارشد اطلاعات، یک پرونده تحلیلی دقیق برای موجودیت "${entityId}" به زبان فارسی و بر اساس زمینه خبری زیر تهیه کن:\n${context}\n
پرونده باید کاملاً بی‌طرفانه و مبتنی بر داده‌های ارائه‌شده باشد.
این بخش‌ها را شامل شود:
1.  **summary:** یک تحلیل کوتاه و فشرده از نقش، اقدامات و نفوذ این موجودیت در رویدادهای اخیر.
2.  **connections:** لیستی از مهم‌ترین موجودیت‌هایی که "${entityId}" با آنها **تعامل مستقیم و گزارش‌شده** داشته است.
3.  **sentiment_analysis:** یک تحلیل احساسات **دقیق و چندوجهی**:
    - **overall:** یک عبارت کلی برای احساسات (مثلاً 'عموماً مثبت'، 'بحث‌برانگیز'، 'پیچیده').
    - **positive_points:** لیستی از جنبه‌های مثبت گزارش‌شده به صورت عینی.
    - **negative_points:** لیستی از جنبه‌های منفی یا چالش‌برانگیز گزارش‌شده به صورت عینی.
    - **confidence_score:** امتیاز اطمینان شما به این تحلیل ('High', 'Medium', 'Low').
    - **reasoning:** چرایی امتیاز اطمینان و خلاصه‌ای از دلایل تحلیل احساسات. به طور خاص توضیح بده که چگونه نکات مثبت و منفی به ارزیابی کلی منجر شده‌اند. **اگر گزارش‌های متناقضی در متن وجود دارد، حتماً به آن اشاره کن.**`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: entityDossierSchema,
            },
        });

        return JSON.parse(response.text);
    });
};