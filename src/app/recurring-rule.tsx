import { useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { RecurringRuleForm } from '@/components/recurring/recurring-rule-form';

/** Criar recorrência (/recurring-rule). Editar regra não existe na API. */
export default function RecurringRuleScreen() {
  const [saving, setSaving] = useState(false);

  return (
    <FormScreen title='Nova recorrência' closeDisabled={saving}>
      <RecurringRuleForm onSavingChange={setSaving} />
    </FormScreen>
  );
}
