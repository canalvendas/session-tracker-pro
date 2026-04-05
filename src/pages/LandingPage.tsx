import { useState, Suspense, lazy, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import heroVideoAsset from "@/assets/hero-video.mp4.asset.json";
import { 
  Leaf, 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Smartphone, 
  FileText, 
  Moon, 
  Cloud,
  Check,
  Star,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Users,
  Award,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PixPaymentModal = lazy(() => 
  import("@/components/PixPaymentModal").then(mod => ({ default: mod.PixPaymentModal }))
);

const features = [
  { icon: BarChart3, title: "Dashboard Inteligente", description: "Estatísticas em tempo real com visualizações claras e insights automáticos" },
  { icon: Calendar, title: "Calendário Interativo", description: "Registre sessões por data com um toque rápido" },
  { icon: TrendingUp, title: "Histórico Completo", description: "Progresso semanal, mensal e anual detalhado" },
  { icon: DollarSign, title: "Controle Financeiro", description: "Ganhos calculados automaticamente em tempo real" },
  { icon: Smartphone, title: "PWA Mobile", description: "Instale no celular como app nativo" },
  { icon: FileText, title: "Relatórios PDF", description: "Relatórios mensais profissionais prontos" },
  { icon: Moon, title: "Modo Escuro/Claro", description: "Tema personalizável para seu conforto" },
  { icon: Cloud, title: "Dados na Nuvem", description: "Sessões sincronizadas e protegidas" }
];

const testimonials = [
  { name: "Dra. Maria Santos", role: "Psicóloga Clínica", content: "O TeraDay revolucionou minha organização. Agora sei exatamente quantas sessões fiz e quanto vou receber!", avatar: "MS" },
  { name: "Dr. Carlos Oliveira", role: "Terapeuta Ocupacional", content: "Simples, rápido e eficiente. Registro minhas sessões em segundos e tenho controle total.", avatar: "CO" },
  { name: "Dra. Ana Paula", role: "Fisioterapeuta", content: "Os relatórios em PDF são perfeitos para minha contabilidade. Recomendo para todos os colegas!", avatar: "AP" }
];

const steps = [
  { number: "01", title: "Escolha seu plano", description: "Profissional ou Gestor, de acordo com sua necessidade", icon: Sparkles },
  { number: "02", title: "Pague via PIX", description: "Escaneie o QR Code e envie o comprovante", icon: Zap },
  { number: "03", title: "Comece a usar", description: "Acesso liberado em até 24 horas", icon: Play }
];

const faqs = [
  { question: "Qual o valor do TeraDay?", answer: "Oferecemos dois planos: Profissional Independente por R$14,99/mês (ideal para terapeutas autônomos) e Gestor por R$24,99/mês (para quem gerencia uma equipe de até 10 profissionais)." },
  { question: "Como funciona o pagamento?", answer: "O pagamento é mensal via PIX. Basta escanear o QR Code ou copiar a chave PIX, efetuar o pagamento e enviar o comprovante pelo WhatsApp. Seu acesso será renovado por mais 30 dias." },
  { question: "Funciona offline?", answer: "Sim! Como um PWA (Progressive Web App), o TeraDay funciona mesmo sem conexão com a internet. Seus dados são sincronizados quando você voltar a ficar online." },
  { question: "Meus dados estão seguros?", answer: "Absolutamente! Seus dados são armazenados de forma segura na nuvem com criptografia de ponta a ponta. Apenas você tem acesso às suas informações." },
  { question: "Posso usar no celular?", answer: "Sim! O TeraDay foi projetado mobile-first. Você pode instalar como um app no seu celular Android ou iPhone." },
  { question: "Como funciona o cálculo financeiro?", answer: "Você define o valor de cada sessão nas configurações. O TeraDay multiplica automaticamente pelo número de sessões, mostrando seus ganhos diários, semanais e mensais." }
];

const plans = [
  {
    name: "Profissional",
    price: 14.99,
    description: "Para terapeutas autônomos",
    features: ["Dashboard em tempo real", "Calendário interativo", "Histórico completo", "Relatórios em PDF", "Modo escuro/claro", "Dados na nuvem", "PWA mobile", "Suporte incluso"],
    highlight: false
  },
  {
    name: "Gestor",
    price: 24.99,
    description: "Gerencie sua equipe",
    features: ["Tudo do plano Profissional", "Cadastrar até 10 profissionais", "Dashboard consolidado", "Visualizar sessões da equipe", "Registrar pagamentos", "Relatórios por profissional", "Notificações de pagamento", "Suporte prioritário"],
    highlight: true
  }
];

const metrics = [
  { label: "Profissionais ativos", value: 500, suffix: "+", icon: Users },
  { label: "Sessões registradas", value: 45000, suffix: "+", icon: BarChart3 },
  { label: "Avaliação média", value: 4.9, suffix: "★", icon: Award },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.unobserve(el); }
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(32px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ value, suffix = "", duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView(0.3);
  
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    const isDecimal = !Number.isInteger(value);
    const startTime = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setCount(isDecimal ? Math.round(current * 10) / 10 : Math.round(current));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {Number.isInteger(value) ? count.toLocaleString('pt-BR') : count.toFixed(1)}
      {suffix}
    </span>
  );
}

function LogoMarquee() {
  const brands = ["Psicologia", "Fisioterapia", "Fonoaudiologia", "Terapia Ocupacional", "Musicoterapia", "Neuropsicologia", "Psicopedagogia", "ABA"];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050a08] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050a08] to-transparent z-10" />
      <div className="flex animate-[marquee_30s_linear_infinite] gap-8">
        {[...brands, ...brands].map((brand, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0 px-5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02]">
            <Leaf className="w-3.5 h-3.5 text-primary/50" />
            <span className="text-sm text-gray-500 whitespace-nowrap">{brand}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "Profissional", amount: 14.99 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleSelectPlan = (planName: string, amount: number) => {
    setSelectedPlan({ name: planName, amount });
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#040907] text-white overflow-x-hidden" onMouseMove={handleMouseMove}>
      {/* Cursor glow */}
      <div 
        className="fixed pointer-events-none z-0 w-[500px] h-[500px] rounded-full opacity-[0.07] transition-transform duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle, hsl(160 50% 50%) 0%, transparent 70%)',
          left: mousePos.x - 250,
          top: mousePos.y - 250,
        }}
      />

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[200px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(hsl(160 50% 50% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(160 50% 50% / 0.4) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 rounded-xl blur-lg" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Tera</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Day</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#funcionalidades" className="hidden sm:inline-block text-sm text-gray-400 hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#planos" className="hidden sm:inline-block text-sm text-gray-400 hover:text-white transition-colors">
              Planos
            </a>
            <a href="#faq" className="hidden sm:inline-block text-sm text-gray-400 hover:text-white transition-colors">
              FAQ
            </a>
            <Link to="/auth">
              <Button className="relative group bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 hover:border-primary/40 backdrop-blur-sm rounded-full px-6 transition-all duration-300">
                <span className="relative z-10 flex items-center gap-2">
                  Entrar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 sm:pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] border border-primary/15 mb-8 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary/90 tracking-wide">A partir de R$14,99/mês</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold mb-6 leading-[1.08] tracking-tight">
                Simplifique sua{" "}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-teal-300">
                    prática terapêutica
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/60 via-emerald-400/40 to-transparent rounded-full" />
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-400 max-w-lg mb-10 leading-relaxed">
                O app definitivo para terapeutas controlarem sessões, finanças e produtividade. 
                Tudo em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#planos">
                  <Button 
                    size="lg" 
                    className="group relative bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white px-8 py-6 text-base rounded-full shadow-[0_0_40px_-8px_hsl(160_50%_50%_/_0.5)] hover:shadow-[0_0_60px_-8px_hsl(160_50%_50%_/_0.6)] w-full sm:w-auto transition-all duration-500"
                  >
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06] hover:border-white/20 px-8 py-6 text-base rounded-full w-full sm:w-auto transition-all duration-300">
                    Ver Recursos
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-primary/80" />
                  </div>
                  <span className="text-xs text-gray-500">Dados criptografados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-primary/80" />
                  </div>
                  <span className="text-xs text-gray-500">Funciona offline</span>
                </div>
              </div>
            </AnimatedSection>

            {/* Right - Video + Stats */}
            <AnimatedSection delay={200}>
              <div className="relative">
                {/* Glow behind video */}
                <div className="absolute -inset-8 bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/10 rounded-[2rem] blur-3xl" />
                
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 backdrop-blur-sm shadow-2xl shadow-black/60">
                  <video
                    src={heroVideoAsset.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto object-cover aspect-video"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                  
                  {/* Floating stats overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { label: "Hoje", value: "8", sub: "R$ 320" },
                        { label: "Semana", value: "32", sub: "R$ 1.280" },
                        { label: "Mês", value: "124", sub: "R$ 4.960" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/[0.06] backdrop-blur-xl rounded-xl p-3 md:p-4 border border-white/[0.08] hover:border-primary/30 transition-colors duration-300">
                          <p className="text-gray-400 text-[10px] md:text-xs mb-0.5">{stat.label}</p>
                          <p className="text-xl md:text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                          <p className="text-primary text-xs md:text-sm font-medium">{stat.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="relative z-10 py-8 border-y border-white/[0.04]">
        <LogoMarquee />
      </section>

      {/* Metrics Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {metrics.map((metric, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/[0.08] border border-primary/10 flex items-center justify-center mx-auto mb-4">
                    <metric.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">
                    <AnimatedCounter value={metric.value} suffix={metric.suffix} />
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm">{metric.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.08] border border-primary/15 mb-6">
                <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Recursos</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
                Tudo para organizar sua{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">prática</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                Funcionalidades pensadas para terapeutas que querem focar no que importa.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map((feature, index) => (
              <AnimatedSection key={index} delay={index * 60}>
                <div className="group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 h-full overflow-hidden">
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.08] border border-primary/15 mb-6">
                <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Como Funciona</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                3 passos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">simples</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <div className="relative group">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 md:p-8 hover:border-primary/20 transition-all duration-500 text-center h-full">
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                      <step.icon className="w-6 h-6 text-primary" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">{step.number}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm">{step.description}</p>
                  </div>
                  
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-3 w-6 items-center justify-center">
                      <div className="w-full border-t-2 border-dashed border-primary/15" />
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.08] border border-primary/15 mb-6">
                <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Depoimentos</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                O que dizem os{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">terapeutas</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="group bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:border-primary/15 transition-all duration-500 h-full flex flex-col relative overflow-hidden">
                  {/* Subtle gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative">
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 flex-1 text-sm leading-relaxed">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-emerald-500/20 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{testimonial.name}</p>
                        <p className="text-gray-500 text-xs">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.08] border border-primary/15 mb-6">
                <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Planos</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Escolha seu{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">plano</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mt-4 text-sm sm:text-base">
                Para profissionais autônomos e gestores de equipe
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <div className={`group relative rounded-2xl p-7 md:p-8 h-full flex flex-col transition-all duration-500 hover:-translate-y-1 ${
                  plan.highlight 
                    ? 'bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent border border-primary/30 shadow-[0_0_60px_-12px_hsl(160_50%_50%_/_0.15)]' 
                    : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/10'
                }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary to-emerald-500 text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-lg shadow-primary/30 tracking-wide uppercase">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-sm">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-500">R$</span>
                      <span className="text-5xl font-bold tracking-tighter tabular-nums">{plan.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-gray-500 text-sm ml-1">/ mês</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.highlight ? 'bg-primary/20 border border-primary/20' : 'bg-white/5 border border-white/5'
                        }`}>
                          <Check className={`w-3 h-3 ${plan.highlight ? 'text-primary' : 'text-gray-500'}`} />
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className={`w-full py-6 text-base rounded-xl transition-all duration-500 ${
                      plan.highlight 
                        ? 'bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white shadow-[0_0_40px_-8px_hsl(160_50%_50%_/_0.4)] hover:shadow-[0_0_60px_-8px_hsl(160_50%_50%_/_0.5)]' 
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => handleSelectPlan(plan.name, plan.price)}
                  >
                    Assinar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.08] border border-primary/15 mb-6">
                <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">FAQ</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Perguntas{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">frequentes</span>
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-6 overflow-hidden data-[state=open]:border-primary/20 data-[state=open]:bg-white/[0.04] transition-all duration-300"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-sm font-medium text-gray-200">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 pb-5 text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-24">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden">
              {/* CTA Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/[0.06] to-emerald-500/[0.04]" />
              <div className="absolute inset-0 border border-primary/15 rounded-3xl" />
              {/* Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
              
              <div className="relative px-8 py-16 md:py-20 text-center">
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_-4px_hsl(160_50%_50%_/_0.4)]">
                  <Leaf className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
                  Pronto para organizar sua{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">prática?</span>
                </h2>
                
                <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-xl mx-auto">
                  Junte-se a centenas de terapeutas que já simplificaram sua rotina.
                </p>
                
                <a href="#planos">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white px-10 py-6 text-base rounded-full shadow-[0_0_40px_-8px_hsl(160_50%_50%_/_0.5)] hover:shadow-[0_0_60px_-8px_hsl(160_50%_50%_/_0.6)] transition-all duration-500"
                  >
                    Ver Planos
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">
              <span className="text-white">Tera</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Day</span>
            </span>
          </div>
          <p className="text-gray-600 text-xs">
            © 2025 TeraDay. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* PIX Payment Modal */}
      <Suspense fallback={null}>
        <PixPaymentModal 
          open={isPaymentModalOpen} 
          onOpenChange={setIsPaymentModalOpen}
          planName={selectedPlan.name}
          amount={selectedPlan.amount}
        />
      </Suspense>
    </div>
  );
}
