import React, { useState, useEffect } from 'react';
import { 
  storage, 
  INITIAL_PRODUCTS, 
  INITIAL_USER, 
  INITIAL_CHANNELS, 
  INITIAL_ONBOARDING 
} from './data/mockData';
import { 
  Product, 
  UserProfile, 
  ConnectedChannel, 
  OnboardingData, 
  ContentType, 
  GeneratedContent 
} from './types';
import { ToastProvider, useToast } from './components/ToastContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { AddProductModal } from './components/AddProductModal';
import { OnboardingModal } from './components/OnboardingModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ConnectChannelModal } from './components/ConnectChannelModal';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailWorkspace } from './pages/ProductDetailWorkspace';
import { CreatePage } from './pages/CreatePage';
import { InsightsPage } from './pages/InsightsPage';
import { ProfilePage } from './pages/ProfilePage';

function AppContent() {
  const { showToast } = useToast();

  // Primary state loaded from storage/seed
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [user, setUser] = useState<UserProfile>(() => storage.getUser());
  const [channels, setChannels] = useState<ConnectedChannel[]>(() => storage.getChannels());
  const [onboarding, setOnboarding] = useState<OnboardingData>(() => storage.getOnboarding());
  const [generationHistory, setGenerationHistory] = useState<GeneratedContent[]>(() => storage.getHistory());

  // Routing State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [createInitialAction, setCreateInitialAction] = useState<ContentType>('listing');

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => !onboarding.completed);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [connectingChannel, setConnectingChannel] = useState<ConnectedChannel | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync to storage
  useEffect(() => {
    storage.saveProducts(products);
  }, [products]);

  useEffect(() => {
    storage.saveUser(user);
  }, [user]);

  useEffect(() => {
    storage.saveChannels(channels);
  }, [channels]);

  useEffect(() => {
    storage.saveOnboarding(onboarding);
  }, [onboarding]);

  useEffect(() => {
    storage.saveHistory(generationHistory);
  }, [generationHistory]);

  // Navigation Helper
  const handleNavigate = (tab: string, productId?: string) => {
    setCurrentTab(tab);
    if (productId) {
      setSelectedProductId(productId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick Action Handler from Home or Suggestions
  const handleQuickAction = (actionType: ContentType, productId?: string) => {
    if (productId) {
      setSelectedProductId(productId);
      setCurrentTab('product-detail');
    } else {
      setCreateInitialAction(actionType);
      setCurrentTab('create');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add Product handler
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    setSelectedProductId(newProduct.id);
    setCurrentTab('product-detail');
  };

  // Update Product handler
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  // Delete Product
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Product removed from catalog', 'info');
  };

  // Channel Connection Success
  const handleChannelConnected = (channelId: string, handle: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? { ...c, status: 'Connected', handle, lastSync: 'Just now' }
          : c
      )
    );
  };

  // Disconnect Channel
  const handleDisconnectChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? { ...c, status: 'Not connected', lastSync: 'Never' }
          : c
      )
    );
    showToast('Channel disconnected', 'info');
  };

  // Reset demo data
  const handleResetData = () => {
    setProducts(INITIAL_PRODUCTS);
    setUser(INITIAL_USER);
    setChannels(INITIAL_CHANNELS);
    setOnboarding(INITIAL_ONBOARDING);
    setGenerationHistory([]);
    storage.saveProducts(INITIAL_PRODUCTS);
    storage.saveUser(INITIAL_USER);
    storage.saveChannels(INITIAL_CHANNELS);
    storage.saveOnboarding(INITIAL_ONBOARDING);
    storage.saveHistory([]);
    setCurrentTab('home');
  };

  // Find active product for product-detail view
  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        user={user}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        onOpenUpgradeModal={() => setIsUpgradeOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          user={user}
          products={products}
          currentTab={currentTab}
          onNavigate={handleNavigate}
          onOpenAddProduct={() => setIsAddProductOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'home' && (
            <HomePage
              user={user}
              products={products}
              onNavigate={handleNavigate}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onOpenUpgradeModal={() => setIsUpgradeOpen(true)}
              onQuickAction={handleQuickAction}
            />
          )}

          {currentTab === 'products' && (
            <ProductsPage
              products={products}
              onNavigate={handleNavigate}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {currentTab === 'product-detail' && activeProduct && (
            <ProductDetailWorkspace
              product={activeProduct}
              onBack={() => handleNavigate('products')}
              onNavigateToCreate={(productId, actionType) => {
                setSelectedProductId(productId);
                if (actionType) setCreateInitialAction(actionType);
                handleNavigate('create');
              }}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {currentTab === 'create' && (
            <CreatePage
              products={products}
              user={user}
              initialProductId={selectedProductId}
              initialActionType={createInitialAction}
              onUpdateUser={setUser}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onSaveGeneration={(gen) => setGenerationHistory((prev) => [gen, ...prev])}
            />
          )}

          {currentTab === 'insights' && (
            <InsightsPage
              products={products}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'profile' && (
            <ProfilePage
              user={user}
              channels={channels}
              onUpdateUser={setUser}
              onOpenConnectChannel={(chan) => setConnectingChannel(chan)}
              onDisconnectChannel={handleDisconnectChannel}
              onOpenUpgradeModal={() => setIsUpgradeOpen(true)}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom & Drawer Nav */}
      <MobileNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* First-Time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={(data) => {
          setOnboarding(data);
          setIsOnboardingOpen(false);
          showToast('Welcome to Sellora AI! Your workspace is ready.', 'success');
        }}
        onSkip={() => {
          setOnboarding({ ...onboarding, completed: true });
          setIsOnboardingOpen(false);
        }}
      />

      {/* AI Credits & Subscription Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        user={user}
        onUpdateCredits={(newTotal, newPlan) => {
          setUser((prev) => ({
            ...prev,
            creditsTotal: newTotal,
            plan: newPlan || prev.plan
          }));
        }}
      />

      {/* Connect Channel Modal */}
      <ConnectChannelModal
        channel={connectingChannel}
        isOpen={!!connectingChannel}
        onClose={() => setConnectingChannel(null)}
        onConnectSuccess={handleChannelConnected}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
