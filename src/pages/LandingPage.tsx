import { useState, Suspense, lazy } from "react";
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
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Lazy load do modal de pagamento para evitar erros quebrarem a página
const PixPaymentModal = lazy(() => 
  import("@/components/PixPaymentModal").then(mod => ({ default: mod.PixPaymentModal }))
);

const features = [
  {
    icon: BarChart3,
    title: "Dashboard Inteligente",
    description: "Visualize estatísticas diárias, semanais e mensais em tempo real"
  },
  {
    icon: Calendar,
    title: "Calendário Interativo",
    description: "Registre sessões por data com um clique"
  },
  {
    icon: TrendingUp,
    title: "Histórico Completo",
    description: "Acompanhe seu progresso semanal, mensal e anual"
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description: "Calcule automaticamente seus ganhos por período"
  },
  {
    icon: Smartphone,
    title: "PWA Mobile",
    description: "Instale no celular como um app nativo"
  },
  {
    icon: FileText,
    title: "Relatórios PDF",
    description: "Baixe relatórios mensais profissionais"
  },
  {
    icon: Moon,
    title: "Modo Escuro/Claro",
    description: "Tema personalizável para seu conforto"
  },
  {
    icon: Cloud,
    title: "Dados na Nuvem",
    description: "Suas sessões sincronizadas e seguras"
  }
];

const testimonials = [
  {
    name: "Dra. Maria Santos",
    role: "Psicóloga Clínica",
    content: "O TeraDay revolucionou minha organização. Agora sei exatamente quantas sessões fiz e quanto vou receber no final do mês!",
    avatar: "MS"
  },
  {
    name: "Dr. Carlos Oliveira",
    role: "Terapeuta Ocupacional",
    content: "Simples, rápido e eficiente. Registro minhas sessões em segundos e tenho controle total da minha prática.",
    avatar: "CO"
  },
  {
    name: "Dra. Ana Paula",
    role: "Fisioterapeuta",
    content: "Os relatórios em PDF são perfeitos para minha contabilidade. Recomendo para todos os terapeutas!",
    avatar: "AP"
  }
];

const steps = [
  {
    number: "01",
    title: "Escolha seu plano",
    description: "Profissional (R$14,99) ou Gestor (R$24,99)"
  },
  {
    number: "02",
    title: "Pague via PIX",
    description: "Escaneie o QR Code e envie o comprovante"
  },
  {
    number: "03",
    title: "Comece a usar",
    description: "Acesso liberado em até 24 horas"
  }
];

const faqs = [
  {
    question: "Qual o valor do TeraDay?",
    answer: "Oferecemos dois planos: Profissional Independente por R$14,99/mês (ideal para terapeutas autônomos) e Gestor por R$24,99/mês (para quem gerencia uma equipe de até 10 profissionais)."
  },
  {
    question: "Como funciona o pagamento?",
    answer: "O pagamento é mensal via PIX. Basta escanear o QR Code ou copiar a chave PIX, efetuar o pagamento e enviar o comprovante pelo WhatsApp. Seu acesso será renovado por mais 30 dias."
  },
  {
    question: "Funciona offline?",
    answer: "Sim! Como um PWA (Progressive Web App), o TeraDay funciona mesmo sem conexão com a internet. Seus dados são sincronizados quando você voltar a ficar online."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Seus dados são armazenados de forma segura na nuvem com criptografia de ponta a ponta. Apenas você tem acesso às suas informações."
  },
  {
    question: "Posso usar no celular?",
    answer: "Sim! O TeraDay foi projetado mobile-first. Você pode instalar como um app no seu celular Android ou iPhone."
  },
  {
    question: "Como funciona o cálculo financeiro?",
    answer: "Você define o valor de cada sessão nas configurações. O TeraDay multiplica automaticamente pelo número de sessões, mostrando seus ganhos diários, semanais e mensais."
  }
];

const plans = [
  {
    name: "Profissional Independente",
    price: 14.99,
    description: "Para terapeutas autônomos",
    features: [
      "Dashboard em tempo real",
      "Calendário interativo",
      "Histórico completo",
      "Relatórios em PDF",
      "Modo escuro/claro",
      "Dados na nuvem",
      "PWA mobile",
      "Suporte incluso"
    ],
    highlight: false
  },
  {
    name: "Gestor",
    price: 24.99,
    description: "Gerencie sua equipe",
    features: [
      "Tudo do plano Profissional",
      "Cadastrar até 10 profissionais",
      "Dashboard consolidado",
      "Visualizar sessões da equipe",
      "Registrar pagamentos",
      "Relatórios por profissional",
      "Notificações de pagamento",
      "Suporte prioritário"
    ],
    highlight: true
  }
];

export function LandingPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "Profissional Independente", amount: 14.99 });

  const handleSelectPlan = (planName: string, amount: number) => {
    setSelectedPlan({ name: planName, amount });
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white overflow-x-hidden">
      {/* Gradient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-primary">Tera</span>
              <span className="text-primary/70">Day</span>
            </span>
          </div>
          <Link to="/auth">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              Entrar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">A partir de R$14,99/mês</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Simplifique sua
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary">
              prática terapêutica
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            O app definitivo para terapeutas controlarem sessões, finanças e produtividade. 
            Tudo em um só lugar, de forma simples e intuitiva.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#planos">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg w-full sm:w-auto"
              >
                Ver Planos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="#funcionalidades">
              <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-white/5 px-8 py-6 text-lg w-full sm:w-auto">
                Ver Funcionalidades
                <ChevronDown className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>

          {/* Hero Video */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-transparent to-transparent z-10 rounded-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-gray-800">
              <video
                src={heroVideoAsset.url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover"
              />
              {/* Overlay Stats */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
                <div className="grid grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-primary/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-primary/20">
                    <p className="text-gray-300 text-xs md:text-sm mb-1">Hoje</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">8</p>
                    <p className="text-primary text-sm md:text-base font-medium">R$ 320</p>
                  </div>
                  <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-emerald-500/20">
                    <p className="text-gray-300 text-xs md:text-sm mb-1">Semana</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">32</p>
                    <p className="text-emerald-400 text-sm md:text-base font-medium">R$ 1.280</p>
                  </div>
                  <div className="bg-teal-500/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-teal-500/20">
                    <p className="text-gray-300 text-xs md:text-sm mb-1">Mês</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">124</p>
                    <p className="text-teal-400 text-sm md:text-base font-medium">R$ 4.960</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para
              <span className="text-primary"> organizar sua prática</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Funcionalidades pensadas especialmente para terapeutas que querem focar no que importa: seus pacientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comece a usar em 3 passos simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl md:text-7xl font-bold text-primary/10 absolute -top-4 -left-2">
                  {step.number}
                </div>
                <div className="relative pt-8 pl-4">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-24 bg-gradient-to-b from-gray-900/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que dizem os
              <span className="text-primary"> terapeutas</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Profissionais que já transformaram sua rotina com o TeraDay
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha seu
              <span className="text-primary"> Plano</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Planos pensados para profissionais autônomos e gestores de equipe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-br from-gray-900/80 to-gray-900/40 rounded-2xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight 
                    ? 'border-2 border-primary shadow-lg shadow-primary/20' 
                    : 'border border-gray-800'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                    Mais Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-gray-400">/ mês</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Pagamento via PIX</p>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.highlight ? 'bg-primary/20' : 'bg-gray-800'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlight ? 'text-primary' : 'text-gray-400'}`} />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  size="lg" 
                  className={`w-full py-6 text-base ${
                    plan.highlight 
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                  onClick={() => handleSelectPlan(plan.name, plan.price)}
                >
                  Assinar Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas
              <span className="text-primary"> Frequentes</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gray-900/50 border border-gray-800 rounded-xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mx-auto mb-8">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pronto para organizar sua
            <span className="text-primary"> prática?</span>
          </h2>
          
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de terapeutas que já simplificaram sua rotina com o TeraDay.
          </p>
          
          <a href="#planos">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg"
            >
              Ver Planos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">
              <span className="text-primary">Tera</span>
              <span className="text-primary/70">Day</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 TeraDay. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* PIX Payment Modal - Lazy loaded com Suspense */}
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
