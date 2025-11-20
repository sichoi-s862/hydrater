import creatureImg from '../assets/creature.jpg';

const features = [
    {
        title: "Telepathic Analytics",
        description: "Understand your audience before they even click. Our AI predicts intent with 99% accuracy.",
        icon: "🧠"
    },
    {
        title: "Hyper-Speed Campaigns",
        description: "Launch multi-verse campaigns in seconds. Time is relative, but your results are instant.",
        icon: "⚡"
    },
    {
        title: "Universal Translation",
        description: "Speak every language in the galaxy. Connect with evolved species across all platforms.",
        icon: "🪐"
    },
    {
        title: "Gravity-Defying ROI",
        description: "Watch your metrics float up. Our optimization engine defies the laws of marketing physics.",
        icon: "🚀"
    }
];

export default function Features() {
    return (
        <section className="py-24 px-6 bg-white relative overflow-hidden">
            <div className="container mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Mascot Image */}
                    <div className="lg:w-1/2 relative order-2 lg:order-1">
                        <div className="relative w-full max-w-[500px] mx-auto aspect-square">
                            <div className="absolute inset-0 bg-planet-primary/10 rounded-full blur-3xl transform scale-90" />
                            <img
                                src={creatureImg}
                                alt="Evolved Human Mascot"
                                className="relative w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />

                            {/* Floating Badge */}
                            <div className="absolute bottom-10 right-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-bounce-slow">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                    <span className="font-semibold text-planet-text">Evolution Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Content */}
                    <div className="lg:w-1/2 space-y-12 order-1 lg:order-2">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold text-planet-text">
                                Tools for the <br />
                                <span className="text-planet-primary">Evolved Human</span>
                            </h2>
                            <p className="text-lg text-planet-text/70 max-w-md">
                                Don't settle for primitive marketing. Upgrade your DNA with our suite of advanced tools designed for the next generation.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-2xl bg-planet-bg/50 border border-planet-primary/10 hover:bg-planet-bg hover:border-planet-primary/30 transition-all duration-300 hover:-translate-y-1 group"
                                >
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                                    <h3 className="text-xl font-bold text-planet-text mb-2">{feature.title}</h3>
                                    <p className="text-sm text-planet-text/60 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
