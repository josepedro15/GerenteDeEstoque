'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Shirt, User, X, Loader2, ArrowRight } from 'lucide-react';
import { generateTryOn } from '@/app/actions/try-on';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export default function TryOnInterface() {
    const [clientImage, setClientImage] = useState<string | null>(null);
    const [productImage, setProductImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clientInputRef = useRef<HTMLInputElement>(null);
    const productInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (file: File, type: 'client' | 'product') => {
        try {
            const base64 = await fileToBase64(file);
            if (type === 'client') setClientImage(base64);
            else setProductImage(base64);
            setError(null);
        } catch (err) {
            console.error('Error reading file', err);
            setError('Erro ao ler a imagem.');
        }
    };

    const handleGenerate = async () => {
        if (!clientImage || !productImage) return;

        setIsGenerating(true);
        setError(null);

        try {
            // NOTE: Using 'gemini-3-flash-preview' as default placeholder, 
            // but in production this should be the specific model the user has access to.
            const result = await generateTryOn(clientImage, productImage);

            if (result.success && result.image) {
                setResultImage(result.image);
            } else {
                throw new Error(result.error || 'Falha ao gerar o provador virtual.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro inesperado.');
        } finally {
            setIsGenerating(false);
        }
    };

    const clearAll = () => {
        setClientImage(null);
        setProductImage(null);
        setResultImage(null);
        setError(null);
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Provador Virtual IA
                </h1>
                <p className="text-muted-foreground">
                    Visualize seus produtos em seus clientes com Inteligência Artificial
                </p>
            </div>

            {/* Main Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">

                {/* Client Upload */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <User className="w-4 h-4" />
                        <span>1. Foto do Cliente</span>
                    </div>
                    <div
                        onClick={() => clientInputRef.current?.click()}
                        className={`
              relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
              ${clientImage ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'}
            `}
                    >
                        {clientImage ? (
                            <img src={clientImage} alt="Client" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-500">
                                <Upload className="w-10 h-10 mb-2" />
                                <span className="text-sm">Carregar Cliente</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={clientInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'client')}
                        />
                        {clientImage && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setClientImage(null); }}
                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Product Upload + Action */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Shirt className="w-4 h-4" />
                        <span>2. Foto do Produto</span>
                    </div>
                    <div
                        onClick={() => productInputRef.current?.click()}
                        className={`
              relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
              ${productImage ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
            `}
                    >
                        {productImage ? (
                            <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500">
                                <Upload className="w-10 h-10 mb-2" />
                                <span className="text-sm">Carregar Roupa</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={productInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'product')}
                        />
                        {productImage && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setProductImage(null); }}
                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Action Button (Desktop Center/Side) */}
                <div className="md:hidden flex flex-col items-center py-4">
                    <ArrowRight className="w-8 h-8 text-gray-300 rotate-90" />
                </div>

                {/* Generate / Result Area */}
                <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-4">
                    {/* Generate Button */}
                    {!resultImage && (
                        <div className="h-full flex flex-col items-center justify-center p-6 lg:p-0">
                            <button
                                onClick={handleGenerate}
                                disabled={!clientImage || !productImage || isGenerating}
                                className={`
                   w-full max-w-xs py-4 px-8 rounded-full font-bold text-lg flex items-center justify-center space-x-2 transition-all
                   ${clientImage && productImage && !isGenerating
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                 `}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6" />
                                        <span>Gerar Provador</span>
                                    </>
                                )}
                            </button>
                            {error && (
                                <p className="mt-4 text-sm text-red-500 text-center bg-red-50 px-3 py-1 rounded-md">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Result View */}
                    <AnimatePresence>
                        {resultImage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100 group"
                            >
                                <img src={resultImage} alt="Result" className="w-full h-full object-cover" />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                                    <a
                                        href={resultImage}
                                        download="provador-virtual.png"
                                        className="px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors"
                                    >
                                        Baixar
                                    </a>
                                    <button
                                        onClick={clearAll}
                                        className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full font-medium hover:bg-white/30 transition-colors"
                                    >
                                        Novo
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Tips / Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <h4 className="font-semibold mb-1 flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Dicas para melhor resultado:</h4>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Use fotos com boa iluminação.</li>
                    <li>A foto do cliente deve mostrar o corpo inteiro ou a parte superior claramente.</li>
                    <li>A foto do produto deve ser, preferencialmente, no cabide ou fundo branco para melhor identificação.</li>
                </ul>
            </div>
        </div>
    );
}
