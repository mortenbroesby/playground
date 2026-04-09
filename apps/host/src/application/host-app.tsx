import { RouterProvider, type RouterProviderProps } from 'react-router-dom';
import { router as defaultRouter } from './routes';

export function HostApp({
  router = defaultRouter,
}: {
  router?: RouterProviderProps['router'];
}) {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
