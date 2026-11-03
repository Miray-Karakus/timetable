import { Toaster } from 'sonner';
import { useTheme } from '../hooks/useTheme';

export function ThemedToaster() {
  const { dark } = useTheme();
  return <Toaster position="bottom-right" richColors closeButton theme={dark ? 'dark' : 'light'} />;
}
