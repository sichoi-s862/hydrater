import planetImg from '../assets/planet.jpg';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-planet-bg px-6 py-20">
            {/* Background Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-planet-secondary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-planet-blue/20 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                {/* Text Content */}
                <div className="space-y-8 text-center md:text-left">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 border border-white/60 backdrop-blur-sm text-planet-text text-sm font-medium shadow-sm">
                        🚀 Welcome to the New Era
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight text-planet-text">
                        Marketing for the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-planet-primary to-planet-secondary">
                            Next Evolution
                        </span>
                    </h1>

                    <p className="text-xl text-planet-text/80 max-w-lg mx-auto md:mx-0 leading-relaxed">
                        Discover a new planet of possibilities. Elevate your brand with tools designed for the evolved marketer.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button className="px-8 py-4 bg-planet-text text-white rounded-2xl font-semibold hover:bg-planet-text/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Start Exploring
                        </button>
                        <button className="px-8 py-4 bg-white text-planet-text border border-white/60 rounded-2xl font-semibold hover:bg-white/80 transition-all shadow-sm backdrop-blur-sm">
                            View Demo
                        </button>
                    </div>
                </div>

                {/* Image Content */}
                <div className="relative flex justify-center">
                    <div className="relative w-full max-w-[500px] aspect-square">
                        <div className="absolute inset-0 bg-gradient-to-tr from-planet-secondary/30 to-planet-blue/30 rounded-full blur-2xl transform scale-110" />
                        <img
                            src={planetImg}
                            alt="New Planet"
                            className="relative w-full h-full object-contain drop-shadow-2xl animate-float"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
