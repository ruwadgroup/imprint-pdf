import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  // Resource route: the loader returns a raw PDF Response (no component).
  route('invoice.pdf', 'routes/invoice.pdf.tsx'),
] satisfies RouteConfig;
