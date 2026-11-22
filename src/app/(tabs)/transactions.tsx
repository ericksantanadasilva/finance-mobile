import { ArrowLeftRight } from 'lucide-react-native';

import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';

// Provisório (4a): os dados entram na 4c
export default function Transactions() {
  return (
    <Page title='Transações'>
      <EmptyState
        icon={<Icon icon={ArrowLeftRight} tone='muted' size={32} />}
        message='Suas transações do mês aparecem aqui.'
      />
    </Page>
  );
}
