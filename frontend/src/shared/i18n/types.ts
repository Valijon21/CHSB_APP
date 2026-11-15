export type SupportedLocale = 'uz' | 'uz_cyrl' | 'ru' | 'kaa';

export interface TranslationDictionary {
  common: {
    loading: string;
    back: string;
    next: string;
    submit: string;
    cancel: string;
    confirm: string;
    close: string;
    error: string;
    success: string;
    save: string;
    search: string;
    filter: string;
    all: string;
    actions: string;
  };
  header: {
    title: string;
    theme: string;
    language: string;
    fontSize: string;
  };
  exam: {
    answered: string;
    unanswered: string;
    remainingTime: string;
    fullscreen: string;
    proctorWarning: string;
    offlineMode: string;
    prevQuestion: string;
    nextQuestion: string;
    submitExam: string;
    navigator: string;
    confirmSubmitUnanswered: string;
  };
  result: {
    title: string;
    score: string;
    percentage: string;
    downloadCert: string;
    backToHome: string;
    note: string;
  };
  teacher: {
    dashboard: string;
    classes: string;
    students: string;
    assessments: string;
    results: string;
    analytics: string;
    reports: string;
    profile: string;
  };
}

