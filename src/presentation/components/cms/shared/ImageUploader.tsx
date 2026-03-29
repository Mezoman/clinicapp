import React from 'react';
import { CloudUpload, Loader2, Trash2 } from 'lucide-react';
import { logger } from '../../../../utils/logger';

interface ImageUploaderProps {
    readonly value: string;
    readonly onUpload: (url: string) => void;
    readonly label: string;
    readonly aspect?: 'square' | 'video' | 'logo';
    readonly cloudName: string;
    readonly preset: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onUpload, label, aspect = 'video', cloudName, preset }) => {
    const [uploading, setUploading] = React.useState(false);
    
    const loadCloudinaryScript = (): Promise<void> => {
        return new Promise((resolve) => {
            if ((globalThis as any).cloudinary) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://upload-widget.cloudinary.com/global/all.js';
            script.async = true;
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    };

    const handleUpload = async () => {
        if (!cloudName || !preset) return;
        setUploading(true);
        try {
            await loadCloudinaryScript();
            (globalThis as any).cloudinary?.openUploadWidget(
                { cloudName, uploadPreset: preset, sources: ['local', 'url'], multiple: false }, 
                (err: any, res: any) => {
                    setUploading(false);
                    if (!err && res?.event === 'success') {
                        onUpload(res.info.secure_url);
                    }
                }
            );
        } catch (error) {
            setUploading(false);
            logger.error('Cloudinary upload error', error instanceof Error ? error : new Error(String(error)));
        }
    };

    const getAspectClass = () => {
        if (aspect === 'logo') return 'aspect-[3/1] max-w-[200px]';
        if (aspect === 'square') return 'aspect-square';
        return 'aspect-video';
    };

    const aspectClass = getAspectClass();

    return (
        <div className="space-y-4">
            <div className={`relative rounded-3xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-page)]/50 overflow-hidden group transition-all hover:border-primary/50 shadow-inner ${aspectClass}`}>
                {value ? (
                    <>
                        <img src={value} alt="Uploaded" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all backdrop-blur-[2px]">
                            <button
                                onClick={() => onUpload('')}
                                className="bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-all border border-red-400/20"
                            >
                                <Trash2 className="size-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button 
                        onClick={handleUpload} 
                        disabled={uploading}
                        className="w-full h-full flex flex-col items-center justify-center gap-4 text-[var(--text-secondary)]/50 group-hover:text-primary transition-all group-disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        ) : (
                            <div className="size-16 rounded-[1.5rem] bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:-translate-y-2 transition-all duration-300">
                                <CloudUpload className="w-8 h-8" />
                            </div>
                        )}
                        <p className="mt-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center px-4">
                            {label || 'اسحب الصور هنا أو اضغط للاختيار'}
                        </p>
                    </button>
                )}
            </div>
        </div>
    );
};
