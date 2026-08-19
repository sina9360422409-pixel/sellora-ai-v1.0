import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  AlertCircle,
  Tag,
  DollarSign,
  Layers,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product } from '../types';
import { useToast } from './ToastContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (newProduct: Product) => void;
}

const CATEGORIES = [
  'Electronics',
  'Accessories',
  'Fashion & Apparel',
  'Beauty & Skincare',
  'Home & Kitchen',
  'Wearables',
  'Bags & Luggage',
  'Sports & Fitness',
  'Digital Products',
  'Other'
];

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Earbuds',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Smart Watch',
    url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Camera Lens',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Leather Wallet',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80'
  }
];

export function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [price, setPrice] = useState('49.99');
  const [currency, setCurrency] = useState('$');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!category) newErrors.category = 'Category is required';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Please enter a valid positive price';
    }
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!image) newErrors.image = 'Product image is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newProduct: Product = {
        id: 'prod-' + Date.now(),
        name: name.trim(),
        category,
        price: Number(price),
        currency,
        image: image || SAMPLE_PHOTO_PRESETS[0].url,
        description: description.trim(),
        status: 'Ready',
        lastUpdated: 'Just now',
        aiContentCount: 0,
        features: [
          'High quality craftsmanship with durable finish',
          'Modern ergonomic aesthetic designed for peak performance',
          'Fast setup and straightforward operation'
        ],
        tags: [category, 'New Arrival', 'Featured'],
        usp: 'Engineered for seamless daily performance and reliability'
      };

      onAddProduct(newProduct);
      setIsSubmitting(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });

      showToast('Product added successfully to your catalog!', 'success');
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add New Product</h2>
              <p className="text-xs text-slate-500">Sellora AI will help generate listings, ads & social posts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-2">
              Product Image <span className="text-rose-500">*</span>
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/50' 
                  : image 
                  ? 'border-slate-300 bg-slate-50/30' 
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {image ? (
                <div className="flex items-center gap-4 text-left">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200 shadow-xs"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Image uploaded ready for AI enhancement
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click or drag to replace with a different photo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage('');
                    }}
                    className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            {!image && (
              <div className="mt-2.5">
                <span className="text-[11px] font-medium text-slate-400 mr-2">Or pick a demo image:</span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {SAMPLE_PHOTO_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImage(preset.url)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errors.image && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.image}
              </p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ultra-Quiet Smart Aromatherapy Diffuser"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            {errors.name && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
              </p>
            )}
          </div>

          {/* Category & Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                Price & Currency <span className="text-rose-500">*</span>
              </label>
              <div className="flex rounded-xl shadow-xs">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl px-3 text-sm text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="C$">C$ (CAD)</option>
                  <option value="A$">A$ (AUD)</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="29.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-r-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              {errors.price && (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.price}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Product Description & Highlights <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Brief summary of materials, size, specs</span>
            </div>
            <textarea
              rows={3}
              placeholder="Describe the product, key benefits, materials, or target customer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            {errors.description && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white text-sm font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding Product...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Add to Sellora</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
