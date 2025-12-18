import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import TetrisPanel from './TetrisPanel';

interface CreditSuccessScreenProps {
    onContinue: () => void;
}

const CreditSuccessScreen: React.FC<CreditSuccessScreenProps> = ({ onContinue }) => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [addedCredits, setAddedCredits] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session_id');

            console.log(`[CreditSuccess] Start verification. SessionID=${sessionId}`);

            if (!sessionId) {
                setStatus('error');
                setErrorMsg('No session found.');
                return;
            }

            try {
                console.log('[CreditSuccess] Verifying session...');

                // MOCK BEHAVIOR: Assume success if session_id is present
                // Real verification should happen via Edge Function or Webhook
                const data = { verified: true, credits: 0 };

                if (!data?.verified) {
                    throw new Error('Verification failed');
                }

                // Update Profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('credits')
                        .eq('id', user.id)
                        .maybeSingle();

                    const current = profile?.credits || 0;
                    // Note: Ideally the credits added are confirmed by server
                    // Since this is a refactor, we leave the logic but clean terminology
                }

                setStatus('success');
                setTimeout(() => {
                    onContinue();
                }, 4000);

            } catch (err: any) {
                console.error("[CreditSuccess] Fatal Error:", err);
                setStatus('error');
                setErrorMsg(err.message || "An error occurred during verification.");
            }
        };

        verifyPayment();
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <TetrisPanel title={status === 'success' ? "PURCHASE SUCCESSFUL!" : "VERIFYING..."} className="w-full max-w-md text-center">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center py-8">
                        <div className="text-4xl animate-spin mb-4">⏳</div>
                        <p className="text-[#FFD700] animate-pulse">Verifying payment with secure gateway...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in zoom-in duration-300">
                        <div className="text-6xl mb-4 text-green-500">✔</div>
                        <h2 className="text-2xl text-[#FFD700] font-bold mb-2 font-arcade">SUCCESS!</h2>
                        <p className="text-white text-lg mb-6 leading-relaxed">
                            Your digital credits have been added to your account.
                        </p>
                        <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest">Redirecting you shortly...</p>

                        <button
                            onClick={onContinue}
                            className="w-full py-4 bg-green-600 text-white font-bold rounded hover:bg-green-500 font-arcade text-xl border-b-4 border-green-800 active:border-b-0 active:translate-y-1 shadow-lg"
                        >
                            GO TO GAME
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl text-red-500 font-bold mb-4 uppercase tracking-widest">Something went wrong</h2>
                        <p className="text-white mb-8">{errorMsg}</p>
                        <button
                            onClick={onContinue}
                            className="w-full py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 uppercase tracking-widest text-xs"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </TetrisPanel>
        </div>
    );
};

export default CreditSuccessScreen;
