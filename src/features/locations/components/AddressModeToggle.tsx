import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface AddressModeToggleProps {
  mode: 'frequent' | 'custom';
  onChange: (mode: 'frequent' | 'custom') => void;
}

export function AddressModeToggle({ mode, onChange }: AddressModeToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" variant={mode === 'frequent' ? 'primary' : 'outline'} onClick={() => onChange('frequent')}>
        {t('locations.frequentPoint')}
      </Button>
      <Button type="button" size="sm" variant={mode === 'custom' ? 'primary' : 'outline'} onClick={() => onChange('custom')}>
        {t('locations.otherAddress')}
      </Button>
    </div>
  );
}
