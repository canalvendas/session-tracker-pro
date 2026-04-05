import { useState, Suspense, lazy, useEffect, useRef } from "react";
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
  Zap
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
  { icon: BarChart3, title: "Dashboard Inteligente", description: "Estatísticas em tempo real com visualizações claras" },
  { icon: Calendar, title: "Calendário Interativo", description: "Registre sessões por data com um toque" },
  { icon: TrendingUp, title: "Histórico Completo", description: "Progresso semanal, mensal e anual" },
  { icon: DollarSign, title: "Controle Financeiro", description: "Ganhos calculados automaticamente" },
  { icon: Smartphone, title: "PWA Mobile", description: "Instale no celular como app nativo" },
  { icon: FileText, title: "Relatórios PDF", description: "Relatórios mensais profissionais" },
  { icon: Moon, title: "Modo Escuro/Claro", description: "Tema personalizável para seu conforto" },
  { icon: Cloud, title: "Dados na Nuvem", description: "Sessões sincronizadas e seguras" }
];

const testimonials = [
  { name: "Dra. Maria Santos", role: "Psicóloga Clínica", content: "O TeraDay revolucionou minha organização. Agora sei exatamente quantas sessões fiz e quanto vou receber!", avatar: "MS" },
  { name: "Dr. Carlos Oliveira", role: "Terapeuta Ocupacional", content: "Simples, rápido e eficiente. Registro minhas sessões em segundos e tenho controle total.", avatar: "CO" },
  { name: "Dra. Ana Paula", role: "Fisioterapeuta", content: "Os relatórios em PDF são perfeitos para minha contabilidade. Recomendo para todos!", avatar: "AP" }
];

const steps = [
  { number: "01", title: "Escolha seu plano", description: "Profissional (R$14,99) ou Gestor (R$24,99)" },
  { number: "02", title: "Pague via PIX", description: "Escaneie o QR Code e envie o comprovante" },
  { number: "03", title: "Comece a usar", description: "Acesso liberado em até 24 horas" }
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
    name: "Profissional Independente",
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

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.unobserve(el); }
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
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
        transform: isInView ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "Profissional Independente", amount: 14.99 });

  const handleSelectPlan = (planName: string, amount: number) => {
    setSelectedPlan({ name: planName, amount });
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050a08] text-white overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[180px] animate-pulse-soft" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-teal-500/8 rounded-full blur-[140px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(160 50% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 50% 50% / 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Tera</span>
              <span className="text-primary">Day</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#planos" className="hidden sm:inline-block text-sm text-gray-400 hover:text-white transition-colors">
              Planos
            </a>
            <a href="#funcionalidades" className="hidden sm:inline-block text-sm text-gray-400 hover:text-white transition-colors">
              Recursos
            </a>
            <Link to="/auth">
              <Button className="bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur-sm rounded-xl px-5">
                Entrar
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary tracking-wide uppercase">A partir de R$14,99/mês</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
                Simplifique sua{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-teal-300">
                  prática terapêutica
                </span>
              </h1>
              
              <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
                O app definitivo para terapeutas controlarem sessões, finanças e produtividade. 
                Tudo em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#planos">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-primary/25 w-full sm:w-auto"
                  >
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 px-8 py-6 text-base rounded-xl w-full sm:w-auto">
                    Ver Recursos
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary/70" />
                  <span className="text-xs text-gray-500">Dados criptografados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary/70" />
                  <span className="text-xs text-gray-500">Funciona offline</span>
                </div>
              </div>
            </AnimatedSection>

            {/* Right - Video + Stats */}
            <AnimatedSection delay={200}>
              <div className="relative">
                {/* Glow behind video */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-emerald-500/10 rounded-3xl blur-2xl" />
                
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl shadow-black/50">
                  <video
                    src={heroVideoAsset.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto object-cover aspect-video"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Floating stats overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Hoje", value: "8", sub: "R$ 320", color: "from-primary/30 to-primary/10 border-primary/20" },
                        { label: "Semana", value: "32", sub: "R$ 1.280", color: "from-emerald-500/30 to-emerald-500/10 border-emerald-500/20" },
                        { label: "Mês", value: "124", sub: "R$ 4.960", color: "from-teal-500/30 to-teal-500/10 border-teal-500/20" },
                      ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.color} backdrop-blur-md rounded-xl p-3 md:p-4 border`}>
                          <p className="text-gray-300 text-[10px] md:text-xs mb-0.5">{stat.label}</p>
                          <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
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

      {/* Features Section */}
      <section id="funcionalidades" className="relative z-10 px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">Recursos</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
                Tudo para organizar sua{" "}
                <span className="text-primary">prática</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Funcionalidades pensadas para terapeutas que querem focar no que importa.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <AnimatedSection key={index} delay={index * 80}>
                <div className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 h-full">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">Como funciona</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                3 passos simples
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <div className="relative text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 mb-5">
                    <span className="text-xl font-bold text-primary">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(100%_-_12px)] w-[calc(100%_-_60px)]">
                      <div className="border-t border-dashed border-white/10 w-full" />
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">Depoimentos</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                O que dizem os{" "}
                <span className="text-primary">terapeutas</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} delay={index * 120}>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-colors h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary/80 text-primary/80" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 flex-1 text-sm leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-gray-500 text-xs">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="relative z-10 px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">Planos</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Escolha seu{" "}
                <span className="text-primary">plano</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mt-4">
                Para profissionais autônomos e gestores de equipe
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plans.map((plan, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <div className={`relative rounded-2xl p-7 md:p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight 
                    ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/40 shadow-xl shadow-primary/10' 
                    : 'bg-white/[0.03] border border-white/[0.06]'
                }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg shadow-primary/30">
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
                      <span className="text-sm text-gray-400">R$</span>
                      <span className="text-5xl font-bold tracking-tight">{plan.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-gray-500 text-sm ml-1">/ mês</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.highlight ? 'bg-primary/20' : 'bg-white/5'
                        }`}>
                          <Check className={`w-3 h-3 ${plan.highlight ? 'text-primary' : 'text-gray-500'}`} />
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className={`w-full py-6 text-base rounded-xl ${
                      plan.highlight 
                        ? 'bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white shadow-lg shadow-primary/25' 
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
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
      <section className="relative z-10 px-6 py-28">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-medium text-primary tracking-widest uppercase mb-4">FAQ</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Perguntas{" "}
                <span className="text-primary">frequentes</span>
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-6 overflow-hidden data-[state=open]:border-primary/20 transition-colors"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-sm font-medium">
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
      <section className="relative z-10 px-6 py-28">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden">
              {/* CTA Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/5" />
              <div className="absolute inset-0 border border-primary/20 rounded-3xl" />
              
              <div className="relative px-8 py-16 md:py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/30">
                  <Leaf className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
                  Pronto para organizar sua{" "}
                  <span className="text-primary">prática?</span>
                </h2>
                
                <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                  Junte-se a centenas de terapeutas que já simplificaram sua rotina.
                </p>
                
                <a href="#planos">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white px-10 py-6 text-base rounded-xl shadow-lg shadow-primary/25"
                  >
                    Ver Planos
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">
              <span className="text-white">Tera</span>
              <span className="text-primary">Day</span>
            </span>
          </div>
          <p className="text-gray-600 text-sm">
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
