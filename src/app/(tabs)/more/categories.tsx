import { Tags } from 'lucide-react-native';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';

// Provisório (4a): os dados entram na 4d
export default function Categories() {
  return (
    <Page title='Categorias' back>
      <EmptyState
        icon={<Icon icon={Tags} tone='muted' size={32} />}
        message='Suas categorias e orçamentos aparecem aqui.'
      />
    </Page>
  );
}
