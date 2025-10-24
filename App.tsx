import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { NewsList } from './components/NewsList';
import { NewsGraph } from './components/NewsGraph';
import { AnalysisPanel } from './components/AnalysisPanel';
import { Spinner } from './components/Spinner';
import { generateIntelligencePackage, verifyNews, generateDailyBriefing, generateEntityDossier } from './services/geminiService';
import type { NewsArticle, GraphData, VerificationResult, WorkflowState, DataFeed, GraphNode, EntityDossier } from './types';
import { WorkflowStatusPanel } from './components/WorkflowStatusPanel';
import { BriefingModal } from './components/BriefingModal';
import { OSINTControlPanel } from './components/OSINTControlPanel';


const initialWorkflowState: WorkflowState = {
  extraction: { name: 'استخراج OSINT', status: 'pending' },
  ai_ml: { name: 'پردازش هوش مصنوعی و یادگیری ماشین', status: 'pending' },
  knowledge_graph: { name: 'پایگاه داده گراف دانش', status: 'pending' },
  api_gateway: { name: 'درگاه API', status: 'pending' },
};

const initialDataFeeds: DataFeed[] = [
    { id: 'global_wires', name: 'سرویس‌های خبری جهانی', description: 'اخبار فوری از خبرگزاری‌های معتبر بین‌المللی.', enabled: true },
    { id: 'social_media', name: 'روندهای شبکه‌های اجتماعی', description: 'تحلیل احساسات و موضوعات داغ از پلتفرم‌های اجتماعی.', enabled: true },
    { id: 'financial_markets', name: 'داده‌های بازارهای مالی', description: 'گزارش‌های اقتصادی و تأثیرات آن بر بازارهای جهانی.', enabled: true },
    { id: 'cyber_security', name: 'هشدارهای امنیت سایبری', description: 'اطلاعات مربوط به تهدیدات و آسیب‌پذیری‌های جدید.', enabled: true },
    { id: 'dark_web', name: 'مانیتورینگ دارک وب', description: 'شناسایی تهدیدات نوظهور و فعالیت‌های غیرقانونی.', enabled: true },
    { id: 'satellite_imagery', name: 'تحلیل تصاویر ماهواره‌ای', description: 'بررسی تغییرات ژئوپلیتیکی و محیطی.', enabled: true },
    { id: 'govt_publications', name: 'نشریات دولتی', description: 'سیاست‌ها، گزارش‌ها و بیانیه‌های رسمی.', enabled: true },
    { id: 'shipping_logs', name: 'ردیابی کشتیرانی دریایی', description: 'نظارت بر زنجیره‌های تأمین و فعالیت‌های تجاری جهانی.', enabled: true },
];


const App: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsArticle | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<GraphNode | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [entityDossier, setEntityDossier] = useState<EntityDossier | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState>(initialWorkflowState);
  const workflowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>(initialDataFeeds);

  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [isLoadingGraph, setIsLoadingGraph] = useState<boolean>(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState<boolean>(false);
  const [isLoadingDossier, setIsLoadingDossier] = useState<boolean>(false);
  const [isBriefingLoading, setIsBriefingLoading] = useState<boolean>(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState<boolean>(false);
  const [briefingContent, setBriefingContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dossierError, setDossierError] = useState<string | null>(null);

  // Unified API busy state to prevent ANY concurrent requests
  const isApiBusy = isLoadingNews || isBriefingLoading || isLoadingVerification || isLoadingDossier;


  const runWorkflowSimulation = (hasError = false) => {
    if (workflowTimerRef.current) {
        clearTimeout(workflowTimerRef.current);
    }
    const steps: (keyof WorkflowState)[] = ['extraction', 'ai_ml', 'knowledge_graph', 'api_gateway'];
    let currentStep = 0;

    const executeStep = () => {
        if (currentStep > 0) {
            const prevStepKey = steps[currentStep - 1];
            setWorkflowState(prev => ({
                ...prev,
                [prevStepKey]: { ...prev[prevStepKey], status: hasError && currentStep === 1 ? 'failed' : 'success' }
            }));
        }

        if (hasError && currentStep === 0) {
            const currentStepKey = steps[currentStep];
             setWorkflowState(prev => ({
                ...prev,
                [currentStepKey]: { ...prev[currentStepKey], status: 'failed' }
            }));
             // Stop simulation on first step error
            return;
        }

        if (currentStep >= steps.length) {
            return; // All steps done
        }

        const currentStepKey = steps[currentStep];
        setWorkflowState(prev => ({
            ...prev,
            [currentStepKey]: { ...prev[currentStepKey], status: 'running' }
        }));

        currentStep++;
        workflowTimerRef.current = setTimeout(executeStep, 1000); // Simulate 1 second per step
    };
    
    executeStep();
  };

  const fetchNewsAndGraphData = useCallback(async () => {
    if (isApiBusy) return;
    setIsLoadingNews(true);
    setIsLoadingGraph(true);
    setError(null);
    setSelectedNewsItem(null);
    setSelectedEntity(null);
    setVerificationResult(null);
    setEntityDossier(null);
    setDossierError(null);
    setNewsItems([]);
    setGraphData(null);
    setWorkflowState(initialWorkflowState);
    runWorkflowSimulation();

    try {
      const activeFeeds = dataFeeds.filter(feed => feed.enabled).map(feed => feed.name);
      const intelligencePackage = await generateIntelligencePackage(activeFeeds);
      
      setNewsItems(intelligencePackage.articles);
      setGraphData(intelligencePackage.graph);
      
    } catch (e) {
      console.error(e);
      let errorMessage = 'خطا در دریافت بسته اطلاعاتی. لطفاً بعداً دوباره تلاش کنید.';
      if (e instanceof Error && (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED'))) {
          errorMessage = 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند لحظه صبر کرده و دوباره تلاش کنید.';
      }
      setError(errorMessage);
      runWorkflowSimulation(true); // Rerun simulation with error flag
    } finally {
      setIsLoadingNews(false);
      setIsLoadingGraph(false);
    }
  }, [dataFeeds, isApiBusy]);

  useEffect(() => {
    fetchNewsAndGraphData();
    return () => { // Cleanup timer on unmount
      if (workflowTimerRef.current) clearTimeout(workflowTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyNews = useCallback(async (article: NewsArticle) => {
    setIsLoadingVerification(true);
    setVerificationResult(null);
    setError(null);
    try {
      const result = await verifyNews(article);
      setVerificationResult(result);
    } catch (e) {
      console.error(e);
      setError('خطا در تأیید صحت مقاله خبری. سرویس هوش مصنوعی ممکن است در دسترس نباشد.');
      setVerificationResult({ analysis: 'خطا: امکان انجام راستی‌آزمایی وجود ندارد.', sources: [] });
    } finally {
      setIsLoadingVerification(false);
    }
  }, []);
  
  const triggerVerification = useCallback(() => {
    if (selectedNewsItem) {
        handleVerifyNews(selectedNewsItem);
    }
  }, [selectedNewsItem, handleVerifyNews]);

  const handleSelectNews = useCallback((article: NewsArticle) => {
    if (isApiBusy) return;
    setSelectedNewsItem(article);
    // Reset other states
    setSelectedEntity(null);
    setVerificationResult(null); // Clear previous verification result
    setEntityDossier(null);
    setDossierError(null);
    // DO NOT automatically verify to prevent rate-limiting
  }, [isApiBusy]);

  const handleSelectNode = useCallback(async (node: GraphNode) => {
    if (isApiBusy) return;
    setSelectedEntity(node);
    setSelectedNewsItem(null);
    setVerificationResult(null);
    setIsLoadingDossier(true);
    setError(null);
    setDossierError(null);
    try {
        const dossier = await generateEntityDossier(node.id, newsItems);
        setEntityDossier(dossier);
    } catch (e) {
        console.error(e);
        const errorMessage = 'خطا در تولید پرونده موجودیت. سرویس هوش مصنوعی ممکن است پاسخگو نباشد.';
        setError(errorMessage);
        setDossierError(errorMessage);
        setEntityDossier(null);
    } finally {
        setIsLoadingDossier(false);
    }
  }, [newsItems, isApiBusy]);

  const handleGenerateBriefing = useCallback(async () => {
    if (newsItems.length === 0 || isApiBusy) return;
    setIsBriefingLoading(true);
    setIsBriefingModalOpen(true);
    setBriefingContent('');
    setError(null);
    try {
        // Use a more compact context to avoid large request bodies
        const context = newsItems.map(a => a.headline).join('\n');
        const briefing = await generateDailyBriefing(context);
        setBriefingContent(briefing);
    } catch (e) {
        console.error(e);
        setBriefingContent('خطا در تهیه گزارش روزانه. لطفاً دوباره تلاش کنید.');
    } finally {
        setIsBriefingLoading(false);
    }
  }, [newsItems, isApiBusy]);

  const handleFeedToggle = (feedId: string) => {
    setDataFeeds(currentFeeds =>
      currentFeeds.map(feed =>
        feed.id === feedId ? { ...feed, enabled: !feed.enabled } : feed
      )
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans flex flex-col">
      <Header onRefresh={fetchNewsAndGraphData} onGenerateBriefing={handleGenerateBriefing} isBusy={isApiBusy} />
      <main className="flex-grow p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[calc(100vh-80px)]">
        {error && (
          <div className="lg:col-span-12 bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">خطا: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Right Column (reversed for RTL) */}
        <div className="lg:col-span-3 h-full flex flex-col gap-6">
            <div className="flex-1 min-h-0 flex flex-col gap-6">
                 {/* News Stream Panel */}
                <div className="flex-1 min-h-0 flex flex-col bg-gray-900/50 backdrop-blur-sm border border-cyan-500/10 rounded-lg p-4">
                  <h2 className="text-xl font-bold mb-4 text-cyan-400">جریان اخبار</h2>
                  <div className="flex-grow overflow-y-auto pl-2">
                    {isLoadingNews ? (
                      <div className="flex justify-center items-center h-full">
                        <Spinner />
                      </div>
                    ) : (
                      <NewsList 
                        newsItems={newsItems} 
                        selectedNewsItem={selectedNewsItem} 
                        onSelectNews={handleSelectNews} 
                        isApiBusy={isApiBusy}
                      />
                    )}
                  </div>
                </div>
                 {/* Data Feed Panel */}
                <div className="flex-none">
                    <OSINTControlPanel feeds={dataFeeds} onFeedToggle={handleFeedToggle} />
                </div>
            </div>
           
            {/* Workflow Status Panel */}
             <div className="flex-none">
              <WorkflowStatusPanel workflowState={workflowState} />
            </div>
        </div>


        {/* Left Column (reversed for RTL) */}
        <div className="lg:col-span-9 h-full flex flex-col gap-6">
          {/* Connections Graph */}
          <div className="flex-1 bg-gray-900/50 backdrop-blur-sm border border-cyan-500/10 rounded-lg p-4 flex flex-col min-h-0">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">گراف ارتباطات</h2>
            <div className="flex-grow w-full h-full relative">
              {isLoadingGraph ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner />
                </div>
              ) : (
                graphData && <NewsGraph data={graphData} onNodeClick={handleSelectNode} isApiBusy={isApiBusy} />
              )}
            </div>
          </div>
          {/* Analysis Panel */}
          <div className="flex-1 bg-gray-900/50 backdrop-blur-sm border border-cyan-500/10 rounded-lg p-4 flex flex-col min-h-0">
             <div className="flex-grow overflow-y-auto pl-2">
              <AnalysisPanel
                selectedArticle={selectedNewsItem}
                verificationResult={verificationResult}
                isLoadingVerification={isLoadingVerification}
                onVerifyArticle={triggerVerification}
                selectedEntity={selectedEntity}
                entityDossier={entityDossier}
                isLoadingDossier={isLoadingDossier}
                dossierError={dossierError}
              />
             </div>
          </div>
        </div>
      </main>
      <BriefingModal
        isOpen={isBriefingModalOpen}
        isLoading={isBriefingLoading}
        content={briefingContent}
        onClose={() => setIsBriefingModalOpen(false)}
      />
    </div>
  );
};

export default App;
