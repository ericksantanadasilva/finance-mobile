import { Repeat } from 'lucide-react-native';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';

// Provisório (4a): os dados entram na 4e
export default function Recurring() {
  return (
    <Page title='Recorrentes' back>
      <EmptyState
        icon={<Icon icon={Repeat} tone='muted' size={32} />}
        message='Suas recorrências aparecem aqui.'
      />
    </Page>
  );
}
