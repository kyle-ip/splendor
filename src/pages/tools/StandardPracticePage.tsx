import { DragFxProvider } from '@/features/solo/DragFx';
import { PurchaseFxProvider } from '@/features/solo/PurchaseFx';
import { SoloToastProvider } from '@/features/solo/SoloToast';
import { SoloHintsProvider } from '@/features/solo/SoloHints';
import { BankTakeFxProvider } from '@/features/solo/BankTakeFx';
import { StandardPractice } from '@/features/standard/StandardPractice';

export function StandardPracticePage() {
  return (
    <DragFxProvider>
      <BankTakeFxProvider>
        <PurchaseFxProvider>
          <SoloToastProvider>
            <SoloHintsProvider>
              <StandardPractice />
            </SoloHintsProvider>
          </SoloToastProvider>
        </PurchaseFxProvider>
      </BankTakeFxProvider>
    </DragFxProvider>
  );
}
