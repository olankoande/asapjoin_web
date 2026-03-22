import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileSignature, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { contractsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getApiError } from '@/lib/api-client';

export default function ContractAcceptancePage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['current-contract'],
    queryFn: () => contractsApi.current().then((response) => response.data),
  });

  const acceptMutation = useMutation({
    mutationFn: (version: string) => contractsApi.accept(version),
    onSuccess: async () => {
      await refreshUser();
      navigate('/search', { replace: true });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Card className="p-6 sm:p-8 border-primary/20 bg-white/95">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileSignature className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conditions d'utilisation</h1>
            <p className="text-sm text-muted-foreground">
              Vous devez accepter le contrat avant de continuer sur l'application.
            </p>
          </div>
        </div>

        {!user && (
          <div className="text-sm text-muted-foreground">Connectez-vous pour consulter et accepter le contrat.</div>
        )}

        {isLoading && <div className="skeleton h-72 rounded-2xl" />}

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl">
            {getApiError(error).message}
          </div>
        )}

        {!isLoading && !error && !contract && (
          <div className="bg-secondary rounded-2xl px-4 py-5 text-sm text-muted-foreground">
            Aucun contrat actif n'est configuré pour le moment.
          </div>
        )}

        {contract && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold">{contract.title}</h2>
                <p className="text-xs text-muted-foreground">Version {contract.version}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                <ShieldCheck className="w-3.5 h-3.5" />
                Contrat actif
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-border bg-secondary/30 p-4 whitespace-pre-wrap text-sm leading-6">
              {contract.content}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => acceptMutation.mutate(contract.version)}
                loading={acceptMutation.isPending}
                disabled={!user}
              >
                J'accepte les conditions
              </Button>
              <Button variant="outline" size="lg" onClick={logout}>
                Se déconnecter
              </Button>
            </div>

            {acceptMutation.error && (
              <div className="mt-4 bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl">
                {getApiError(acceptMutation.error).message}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
