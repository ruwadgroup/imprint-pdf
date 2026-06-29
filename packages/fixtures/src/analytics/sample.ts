export interface AnalyticsKpi {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

export interface AnalyticsBar {
  label: string;
  value: number;
}

export interface AnalyticsRankedPage {
  page: string;
  views: number;
  share: number;
}

export interface AnalyticsData {
  title: string;
  period: string;
  kpis: AnalyticsKpi[];
  trafficByChannel: AnalyticsBar[];
  conversionTrend: number[];
  topPages: AnalyticsRankedPage[];
}

export const analyticsSample: AnalyticsData = {
  title: 'Growth Analytics Dashboard',
  period: 'May 2026',
  kpis: [
    { label: 'Total sessions', value: '482.1K', delta: '+18.3%', up: true },
    { label: 'Unique visitors', value: '312.7K', delta: '+14.0%', up: true },
    { label: 'Conversion rate', value: '3.84%', delta: '+0.42pt', up: true },
    { label: 'Avg. order value', value: '$127.40', delta: '+5.1%', up: true },
    { label: 'Bounce rate', value: '38.2%', delta: '-2.6pt', up: true },
    { label: 'Revenue', value: '$1.49M', delta: '-1.8%', up: false },
  ],
  trafficByChannel: [
    { label: 'Organic', value: 184000 },
    { label: 'Direct', value: 121000 },
    { label: 'Paid', value: 86000 },
    { label: 'Social', value: 58000 },
    { label: 'Email', value: 33000 },
  ],
  conversionTrend: [2.9, 3.1, 3.0, 3.3, 3.5, 3.4, 3.7, 3.6, 3.8, 3.84],
  topPages: [
    { page: '/products/aurora-headphones', views: 48200, share: 12.4 },
    { page: '/collections/new-arrivals', views: 39600, share: 10.2 },
    { page: '/products/lumen-smart-lamp', views: 31400, share: 8.1 },
    { page: '/blog/spring-buying-guide', views: 27800, share: 7.2 },
    { page: '/pricing', views: 22100, share: 5.7 },
    { page: '/products/nimbus-backpack', views: 18900, share: 4.9 },
    { page: '/about', views: 14300, share: 3.7 },
  ],
};
