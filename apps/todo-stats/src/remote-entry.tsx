import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import type { MicroFrontendModule } from '@playground/types';

import { TodoStatsApp } from './TodoStatsApp';

const moduleImpl: MicroFrontendModule = {
  mount(container, props) {
    const root = createRoot(container);

    root.render(
      <StrictMode>
        <MantineProvider defaultColorScheme="light">
          <TodoStatsApp bridge={props.bridge} />
        </MantineProvider>
      </StrictMode>,
    );

    return {
      unmount: () => root.unmount(),
    };
  },
};

export const mount = moduleImpl.mount;
export default moduleImpl;
