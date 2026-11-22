import { Target } from 'lucide-react-native';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';

// Provisório (4a): os dados entram na 4f
export default function Goals() {
  return (
    <Page title='Metas'>
      <EmptyState
        icon={<Icon icon={Target} tone='muted' size={32} />}
        message='Suas metas aparecem aqui.'
      />
    </Page>
  );
}
