import React, { useState, useRef } from 'react';
import { authService } from '../services/authService';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface RegistrationFormProps {
    onBack: () => void;
    onSuccess: () => void;
    onGoToLogin: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBack, onSuccess, onGoToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadPhoto = async (userId: string): Promise<string | null> => {
        if (!photoFile || !storage) return null;
        try {
            const storageRef = ref(storage, `profile_photos/${userId}`);
            await uploadBytes(storageRef, photoFile);
            const downloadUrl = await getDownloadURL(storageRef);
            return downloadUrl;
        } catch (err) {
            console.error("Photo upload failed:", err);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Wachtwoorden komen niet overeen.");
            return;
        }

        setLoading(true);
        try {
            const user = await authService.signup(email, password, name, null);

            // Upload photo if selected
            if (photoFile && user) {
                const photoUrl = await uploadPhoto(user.uid);
                if (photoUrl) {
                    // Update profile with photo URL
                    const { updateProfile } = await import('firebase/auth');
                    await updateProfile(user, { photoURL: photoUrl });
                }
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || "Er is een fout opgetreden bij het registreren.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[100dvh] p-6 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors text-sm flex items-center gap-1"
                >
                    <span>←</span> Terug
                </button>

                <div className="text-center mb-6 mt-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Account Aanmaken
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Photo Upload + Name Row */}
                    <div className="flex items-center gap-4">
                        {/* Circular Photo Upload */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50 shrink-0 overflow-hidden"
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span className="text-[10px] text-gray-400 mt-1">Foto</span>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />

                        {/* Name Field */}
                        <div className="flex-1">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all placeholder:text-gray-400"
                                    placeholder="Volledige naam"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </span>
                        <input
                            type="email"
                            required
                            className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all placeholder:text-gray-400"
                            placeholder="E-mailadres"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            className="w-full bg-gray-100 rounded-xl pl-10 pr-12 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all placeholder:text-gray-400"
                            placeholder="Wachtwoord"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                        </button>
                    </div>

                    {/* Repeat Password Field */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all placeholder:text-gray-400"
                            placeholder="Herhaal wachtwoord"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-4 rounded-xl text-center">
                            {error}
                            {error.includes("Log in?") && (
                                <button
                                    type="button"
                                    onClick={onGoToLogin}
                                    className="block w-full mt-2 text-indigo-600 font-bold underline"
                                >
                                    Ga naar Inloggen
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Laden...' : 'Account Aanmaken'}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={onGoToLogin}
                            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            Heb je al een account? <span className="text-indigo-600 font-bold ml-1">Log in</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationForm;
