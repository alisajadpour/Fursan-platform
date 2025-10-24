import React, { useState, useEffect } from 'react';
import { Spinner } from './Spinner';
import type { NewsArticle, VerificationResult, GraphNode, EntityDossier } from '../types';

interface AnalysisPanelProps {
  selectedArticle: NewsArticle | null;
  verificationResult: VerificationResult | null;
  isLoadingVerification: boolean;
  onVerifyArticle: () => void;
  selectedEntity: GraphNode | null;
  entityDossier: EntityDossier | null;
  isLoadingDossier: boolean;
  dossierError: string | null;
}

const renderInitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
        <p className="text-center font-medium">یک مقاله برای راستی‌آزمایی یا یک موجودیت از گراف را برای تحلیل انتخاب کنید.</p>
        <p className="text-center text-sm text-gray-600 mt-1">ابزارهای تحلیلی مبتنی بر هوش مصنوعی.</p>
    </div>
);

const renderFactCheck = (article: NewsArticle, result: VerificationResult | null, isLoading: boolean, onVerify: () => void) => (
    <div className="animate-fade-in">
        <div className="mb-4 pb-4 border-b border-gray-700">
          <h3 className="font-bold text-lg text-cyan-300 mb-1">{article.headline}</h3>
          <p className="text-sm text-gray-400 italic">"{article.summary}"</p>
        </div>
      
      {!result && !isLoading && (
          <div className="text-center p-4 flex flex-col items-center gap-4">
               <p className="text-sm text-gray-400">برای تأیید این خبر در برابر منابع وب، راستی‌آزمایی را شروع کنید.</p>
              <button
                  onClick={onVerify}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 shadow-md hover:shadow-cyan-500/40"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944a11.954 11.954 0 007.834 3.055a1 1 0 00.469-1.945A13.954 13.954 0 0010 0C4.612 0 .328 4.347.166 9.999a1 1 0 001.999.001A11.954 11.954 0 0010 1.944a11.954 11.954 0 00-7.834-3.055a1 1 0 00-.469 1.945z" clipRule="evenodd" />
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" />
                </svg>
                  <span>شروع راستی‌آزمایی</span>
              </button>
          </div>
      )}

      {result && (
        <div>
          <h4 className="font-semibold text-md mb-2 text-gray-100">تحلیل هوش مصنوعی</h4>
          <p className="text-sm bg-black/30 p-3 rounded-md mb-4 whitespace-pre-wrap">{result.analysis}</p>
          
          <h4 className="font-semibold text-md mb-2 text-gray-100">منابع یافت‌شده</h4>
          {result.sources?.some(s => s.web?.uri) ? (
            <ul className="space-y-2">
              {result.sources.map((source, index) => source.web?.uri && (
                <li key={index}>
                  <a 
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center space-x-3 text-cyan-400 hover:bg-cyan-900/50 p-2 rounded-md transition-all"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-cyan-500 group-hover:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-sm group-hover:text-cyan-300 truncate" title={source.web.title || source.web.uri}>{source.web.title || new URL(source.web.uri).hostname}</span>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-sm text-gray-500 italic">هیچ منبع وبی توسط هوش مصنوعی یافت نشد.</p>
          )}
        </div>
      )}
    </div>
);

const getConfidenceColor = (score: 'High' | 'Medium' | 'Low') => {
    if (score === 'High') return 'text-green-400';
    if (score === 'Medium') return 'text-yellow-400';
    return 'text-red-400';
}

const EntityDossierView: React.FC<{ entity: GraphNode, dossier: EntityDossier | null, error: string | null }> = ({ entity, dossier, error }) => {
    const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);

    useEffect(() => {
        const storedFeedback = localStorage.getItem(`fursan_feedback_entity_${entity.id}`);
        if (storedFeedback === 'good' || storedFeedback === 'bad') {
            setFeedback(storedFeedback);
        } else {
            setFeedback(null);
        }
    }, [entity.id]);

    const handleFeedback = (rating: 'good' | 'bad') => {
        localStorage.setItem(`fursan_feedback_entity_${entity.id}`, rating);
        setFeedback(rating);
    };

    if (error) {
        return (
            <div className="animate-fade-in">
                <div className="mb-4 pb-4 border-b border-gray-700">
                    <h3 className="font-bold text-lg text-red-400 mb-1">خطا در تحلیل موجودیت: {entity.id}</h3>
                    <p className="text-sm text-gray-400 font-mono">نوع: {entity.group}</p>
                </div>
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-4 pb-4 border-b border-gray-700">
                <h3 className="font-bold text-lg text-cyan-300 mb-1">پرونده موجودیت: {entity.id}</h3>
                <p className="text-sm text-gray-400 font-mono">نوع: {entity.group}</p>
            </div>

            {dossier ? (
                 <div className="flex flex-col justify-between">
                    <div>
                        <h4 className="font-semibold text-md mb-2 text-gray-100">خلاصه تحلیلی</h4>
                        <p className="text-sm bg-black/30 p-3 rounded-md mb-4 whitespace-pre-wrap">{dossier.summary}</p>

                        <h4 className="font-semibold text-md mb-2 text-gray-100">ارتباطات کلیدی</h4>
                        {dossier.connections.length > 0 ? (
                            <ul className="space-y-2 mb-4">
                                {dossier.connections.map((conn, index) => (
                                    <li key={index} className="flex items-center text-sm bg-black/30 p-2 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        {conn}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic bg-black/30 p-2 rounded-md mb-4">ارتباط مستقیمی یافت نشد.</p>
                        )}
                        
                        <h4 className="font-semibold text-md mb-2 text-gray-100">تحلیل احساسات دقیق</h4>
                        <div className="bg-black/30 p-3 rounded-md space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-300">ارزیابی کلی: <span className="text-cyan-400 font-mono">{dossier.sentiment_analysis.overall}</span></span>
                                <span className={`font-bold text-xs px-2 py-1 rounded-full ${getConfidenceColor(dossier.sentiment_analysis.confidence_score)} bg-gray-800`}>
                                    اطمینان: {dossier.sentiment_analysis.confidence_score}
                                </span>
                            </div>

                            <div>
                                <h5 className="font-semibold text-sm text-green-400 mb-1">نکات مثبت</h5>
                                {dossier.sentiment_analysis.positive_points.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                        {dossier.sentiment_analysis.positive_points.map((point, i) => <li key={i}>{point}</li>)}
                                    </ul>
                                ) : <p className="text-xs text-gray-500 italic">نکته مثبت مشخصی یافت نشد.</p>}
                            </div>

                             <div>
                                <h5 className="font-semibold text-sm text-red-400 mb-1">نکات منفی</h5>
                                {dossier.sentiment_analysis.negative_points.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                        {dossier.sentiment_analysis.negative_points.map((point, i) => <li key={i}>{point}</li>)}
                                    </ul>
                                ) : <p className="text-xs text-gray-500 italic">نکته منفی مشخصی یافت نشد.</p>}
                            </div>

                             <div>
                                <h5 className="font-semibold text-sm text-gray-400 mb-1">دلایل تحلیل</h5>
                                <p className="text-xs text-gray-400 italic">{dossier.sentiment_analysis.reasoning}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-end gap-4">
                        <span className="text-xs text-gray-400">آیا این تحلیل مفید بود؟</span>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={() => handleFeedback('good')}
                                disabled={!!feedback}
                                className={`p-1 rounded-full transition-colors disabled:opacity-60 ${feedback === 'good' ? 'text-green-400 bg-green-900/50' : 'hover:bg-gray-700'}`}
                                aria-label="تحلیل خوب بود"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.942-.671l2.716-6.452A1 1 0 0016 9.5H12.5a1.5 1.5 0 01-1.5-1.5V3.333a1 1 0 00-1-1 1 1 0 00-1 1v1.167a2.5 2.5 0 01-2.5 2.5H6z" /></svg>
                            </button>
                             <button
                                onClick={() => handleFeedback('bad')}
                                disabled={!!feedback}
                                className={`p-1 rounded-full transition-colors disabled:opacity-60 ${feedback === 'bad' ? 'text-red-400 bg-red-900/50' : 'hover:bg-gray-700'}`}
                                aria-label="تحلیل بد بود"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.364a1 1 0 00-.942.671L2.978 9.119A1 1 0 004 10.5H7.5a1.5 1.5 0 011.5 1.5v5.167a1 1 0 001 1 1 1 0 001-1v-1.167a2.5 2.5 0 012.5-2.5H14z" /></svg>
                            </button>
                        </div>
                    </div>
                 </div>
            ) : null}
        </div>
    );
};


export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
    selectedArticle, verificationResult, isLoadingVerification, onVerifyArticle,
    selectedEntity, entityDossier, isLoadingDossier, dossierError
}) => {

  const isLoading = isLoadingVerification || isLoadingDossier;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
        <Spinner />
        <p className="mt-4 font-mono text-cyan-400">
            {isLoadingVerification ? 'در حال راستی‌آزمایی...' : 'در حال تولید پرونده...'}
        </p>
      </div>
    );
  }

  if (selectedEntity) {
    return <EntityDossierView entity={selectedEntity} dossier={entityDossier} error={dossierError} />;
  }

  if (selectedArticle) {
    return renderFactCheck(selectedArticle, verificationResult, isLoadingVerification, onVerifyArticle);
  }
  
  return renderInitialState();
};