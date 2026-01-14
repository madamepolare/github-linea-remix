import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { languages, LanguageCode } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { Check, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const currentLanguage = i18n.language as LanguageCode;

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    const lang = languages.find(l => l.code === code);
    toast({
      title: t('settings.languageChanged'),
      description: t('settings.languageChangedDescription', { language: lang?.name }),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.language')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.languageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="outline"
                className={cn(
                  'h-auto py-4 px-6 flex flex-col items-center gap-2 relative',
                  currentLanguage === lang.code && 'border-primary bg-primary/5 ring-1 ring-primary'
                )}
                onClick={() => handleLanguageChange(lang.code)}
              >
                {currentLanguage === lang.code && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
