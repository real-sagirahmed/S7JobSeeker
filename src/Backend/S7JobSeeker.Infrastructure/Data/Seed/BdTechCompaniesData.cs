using System.Text.Json;
using S7JobSeeker.Core.Entities;
using S7JobSeeker.Core.Enums;

namespace S7JobSeeker.Infrastructure.Data.Seed;

public static class BdTechCompaniesData
{
    public static List<BdTechCompany> GetSeedCompanies()
    {
        return
        [
            // Tier 1: Global Enterprise & Outsourcing Giants
            Create("Brain Station 23", "brain-station-23", "https://brainstation-23.com", "https://brainstation-23.com/career", "https://linkedin.com/company/brainstation23",
                CompanyCategory.EnterpriseOutsourcing, "Enterprise ERP, FinTech, Cloud & Mobile Solutions",
                "Leading enterprise software development company in Bangladesh serving PayPal, British American Tobacco, and European banks.",
                ["C#", ".NET", "React", "Angular", "Python", "AWS", "Azure", "Flutter", "SQL Server"], "Dhaka, Bangladesh", "UK, USA, Netherlands, Germany", "Hybrid", "500-1000"),

            Create("BJIT Group", "bjit-group", "https://bjitgroup.com", "https://bjitgroup.com/career", "https://linkedin.com/company/bjit-limited",
                CompanyCategory.EnterpriseOutsourcing, "FinTech, AI, Embedded Systems, Cloud Platforms",
                "Joint venture enterprise software powerhouse partnered with Japanese giants (Sony, Panasonic) and European enterprises.",
                ["Java", "Spring Boot", "C#", ".NET", "React", "Node.js", "Python", "AWS", "Docker"], "Dhaka, Bangladesh", "Tokyo (Japan), USA, Finland, Singapore", "Hybrid", "500-1000"),

            Create("Enosis Solutions", "enosis-solutions", "https://enosisbd.com", "https://enosisbd.com/careers", "https://linkedin.com/company/enosis-solutions",
                CompanyCategory.EnterpriseOutsourcing, "High-Performance Cloud & SaaS Applications",
                "Prestigious software development partner for North American technology innovators and Silicon Valley startups.",
                ["C#", ".NET", "React", "Python", "Java", "TypeScript", "SQL Server", "AWS", "Docker"], "Dhaka, Bangladesh", "San Jose, USA", "Onsite", "200-500"),

            Create("Kaz Software", "kaz-software", "https://kaz.com.bd", "https://kaz.com.bd/careers", "https://linkedin.com/company/kaz-software",
                CompanyCategory.EnterpriseOutsourcing, "Bespoke Web, Mobile & Data Engineering",
                "Award-winning custom software engineering company with 20+ years of building software for US, UK, and European clients.",
                ["C#", ".NET", "React", "Node.js", "TypeScript", "PostgreSQL", "Azure", "Docker"], "Dhaka, Bangladesh", "California, USA", "Hybrid", "100-250"),

            Create("Vivasoft Limited", "vivasoft-ltd", "https://vivasoftltd.com", "https://vivasoftltd.com/career", "https://linkedin.com/company/vivasoftltd",
                CompanyCategory.EnterpriseOutsourcing, "Dedicated Engineering Teams & Product Development",
                "Rapidly growing global engineering consulting company serving top European and North American scale-ups.",
                ["Go", "Python", "C#", ".NET", "React", "Vue", "AWS", "Kubernetes", "PostgreSQL"], "Dhaka, Bangladesh", "Munich, Germany", "Hybrid", "200-500"),

            Create("Selise Digital Platforms", "selise-digital-platforms", "https://selise.ch", "https://selise.ch/careers", "https://linkedin.com/company/selise-digital-platforms",
                CompanyCategory.EnterpriseOutsourcing, "Digital Platform Engineering, Cloud Native Ecosystems",
                "Swiss-origin digital platform and cloud native consultancy engineering high-scale portals for European institutions.",
                ["Node.js", "Angular", "TypeScript", "Python", "C#", ".NET", "Docker", "AWS", "MongoDB"], "Dhaka, Bangladesh", "Zurich, Switzerland; Dubai, UAE", "Hybrid", "250-500"),

            Create("Cefalo Bangladesh", "cefalo-bangladesh", "https://cefalo.com", "https://cefalo.com/career", "https://linkedin.com/company/cefalo",
                CompanyCategory.EnterpriseOutsourcing, "Scandinavian Dedicated Agile Software Teams",
                "Norwegian-owned premier software engineering firm known for world-class developer work culture and enterprise media platforms.",
                ["C#", ".NET", "React", "Java", "Python", "TypeScript", "Azure", "Docker", "Kubernetes"], "Dhaka, Bangladesh", "Oslo, Norway", "Hybrid", "100-250"),

            Create("AppsCode", "appscode", "https://appscode.com", "https://appscode.com/careers", "https://linkedin.com/company/appscode",
                CompanyCategory.CloudDevOpsAndInfra, "KubeDB, KubeVault, ByteBuilders, Kubernetes Native Tools",
                "World-renowned Kubernetes tooling provider and CNCF member building cutting-edge container database orchestrators.",
                ["Go", "Kubernetes", "Docker", "Linux", "gRPC", "PostgreSQL", "Cloud Native", "GitOps"], "Dhaka, Bangladesh", "Delaware, USA", "Remote", "50-100"),

            Create("Augmedix Bangladesh", "augmedix-bd", "https://augmedix.com", "https://augmedix.com/careers", "https://linkedin.com/company/augmedix",
                CompanyCategory.AIAndDataIntelligence, "AI Medical Documentation & Ambient Clinical EHR",
                "Nasdaq-listed global health-tech innovator combining LLMs, speech NLP, and real-time medical transcription.",
                ["Python", "React", "Node.js", "AI", "Machine Learning", "NLP", "AWS", "Docker"], "Dhaka, Bangladesh", "San Francisco, USA", "Hybrid", "500-1000"),

            Create("Optimizely BD", "optimizely-bd", "https://optimizely.com", "https://optimizely.com/careers", "https://linkedin.com/company/optimizely",
                CompanyCategory.GlobalSaaSAndProduct, "Digital Experience Platform (DXP), CMS, A/B Testing",
                "Global leader in digital experience and content experimentation engineering its flagship DXP engine in Dhaka.",
                ["C#", ".NET", "React", "TypeScript", "Azure", "Microservices", "REST API", "SQL Server"], "Dhaka, Bangladesh", "New York, USA; Stockholm, Sweden", "Hybrid", "200-500"),

            Create("Therap (BD) Ltd", "therap-bd", "https://therapservices.net", "https://therapservices.net/careers", "https://linkedin.com/company/therap-services",
                CompanyCategory.GlobalSaaSAndProduct, "Therap Suite for Developmental Disabilities",
                "US national leader in electronic health and documentation software for developmental disabilities organizations.",
                ["Java", "Spring Boot", "Oracle", "JavaScript", "React", "REST API", "SQL", "Linux"], "Dhaka, Bangladesh", "Connecticut, USA", "Onsite", "200-500"),

            Create("Kona Software Lab", "kona-software-lab", "https://konasl.com", "https://konasl.com/career", "https://linkedin.com/company/konasl",
                CompanyCategory.FintechAndHighScale, "KonaPay, Chip Operating Systems, Digital Payment Platforms",
                "R&D hub of South Korean smart card & payment technology pioneer Kona I, powering national EMV and payment cards.",
                ["Java", "C++", "Android", "Spring Boot", "C#", "Cryptography", "PostgreSQL", "Docker"], "Dhaka, Bangladesh", "Seoul, South Korea", "Hybrid", "200-500"),

            Create("Dynamic Solution Innovators (DSi)", "dynamic-solution-innovators", "https://dsinnovators.com", "https://dsinnovators.com/career", "https://linkedin.com/company/dsinnovators",
                CompanyCategory.EnterpriseOutsourcing, "Telecom Billing, Enterprise Core Systems, Cloud Applications",
                "Established software engineering powerhouse specializing in high-throughput enterprise systems and fintech.",
                ["Java", "Spring Boot", "C#", ".NET", "React", "Python", "PostgreSQL", "AWS"], "Dhaka, Bangladesh", "USA", "Hybrid", "100-250"),

            Create("DataSoft Systems", "datasoft-systems", "https://datasoft-bd.com", "https://datasoft-bd.com/career", "https://linkedin.com/company/datasoft",
                CompanyCategory.EnterpriseOutsourcing, "Microfin360, Port Management System, IoT Systems",
                "CMMI Level 5 software house that modernized microfinance across Asia and automated Chittagong Port operations.",
                ["C#", ".NET", "Java", "React", "SQL Server", "Oracle", "IoT", "Mobile"], "Dhaka, Bangladesh", "Tokyo, Japan", "Hybrid", "250-500"),

            // Tier 2: Global WordPress, Web & Dev SaaS Products
            Create("WPDeveloper", "wpdeveloper", "https://wpdeveloper.com", "https://wpdeveloper.com/careers", "https://linkedin.com/company/wpdeveloper",
                CompanyCategory.GlobalSaaSAndProduct, "Essential Addons for Elementor, NotificationX, BetterDocs, Templately",
                "Global product creator powering 6+ million websites across 180 countries with enterprise WordPress and SaaS tools.",
                ["PHP", "React", "JavaScript", "TypeScript", "WordPress", "Node.js", "Docker", "REST API"], "Dhaka, Bangladesh", "USA", "Hybrid", "100-250"),

            Create("weDevs", "wedevs", "https://wedevs.com", "https://wedevs.com/careers", "https://linkedin.com/company/wedevs",
                CompanyCategory.GlobalSaaSAndProduct, "Dokan Multivendor, WP Project Manager, WP User Frontend, wePos",
                "Pioneering SaaS creator of Dokan (world's #1 multivendor e-commerce engine) and enterprise business tools.",
                ["PHP", "Vue", "JavaScript", "WordPress", "MySQL", "Docker", "REST API", "Tailwind CSS"], "Dhaka, Bangladesh", "USA", "Hybrid", "100-250"),

            Create("Ollyo", "ollyo", "https://ollyo.com", "https://ollyo.com/careers", "https://linkedin.com/company/ollyo",
                CompanyCategory.GlobalSaaSAndProduct, "JoomShaper, SP Page Builder, Helix Ultimate, Tutor LMS",
                "Leading digital product company building web builder tools, LMS platforms, and component libraries globally.",
                ["PHP", "React", "Vue", "TypeScript", "JavaScript", "CSS", "UI/UX", "Docker"], "Dhaka, Bangladesh", "Global", "Hybrid", "100-250"),

            Create("Themeum", "themeum", "https://themeum.com", "https://themeum.com/careers", "https://linkedin.com/company/themeum",
                CompanyCategory.GlobalSaaSAndProduct, "Tutor LMS, Droip, WP Crowdfunding",
                "Creators of Tutor LMS, one of the most widely used eLearning software suites in the global web market.",
                ["PHP", "React", "JavaScript", "WordPress", "Docker", "GraphQL", "Tailwind CSS"], "Dhaka, Bangladesh", "Global", "Hybrid", "50-100"),

            Create("AuthLab", "authlab", "https://authlab.io", "https://authlab.io/career", "https://linkedin.com/company/authlab",
                CompanyCategory.GlobalSaaSAndProduct, "Fluent Forms, FluentCRM, WP Social Ninja, PayPack",
                "Sylhet-born global software powerhouse engineering high-velocity marketing automation and form infrastructure.",
                ["PHP", "Vue", "JavaScript", "MySQL", "REST API", "WordPress", "Docker"], "Sylhet, Bangladesh", "Global", "Hybrid", "50-100"),

            Create("RadiusTheme", "radiustheme", "https://radiustheme.com", "https://radiustheme.com/career", "https://linkedin.com/company/radiustheme",
                CompanyCategory.GlobalSaaSAndProduct, "Classified Listing, Team Pro, FoodBook",
                "Top marketplace author building specialized web plugins, directory platforms, and SaaS web modules.",
                ["PHP", "React", "JavaScript", "WordPress", "MySQL", "Tailwind CSS"], "Dhaka, Bangladesh", "Global", "Hybrid", "50-100"),

            // Tier 3: High-Scale Consumer Tech, FinTech & Logistics
            Create("bKash Limited", "bkash", "https://bkash.com", "https://bkash.com/careers", "https://linkedin.com/company/bkash-ltd",
                CompanyCategory.FintechAndHighScale, "bKash Mobile Financial Platform, Merchant Payments",
                "Bangladesh's first unicorn fintech handling tens of millions of daily financial transactions with bank-grade security.",
                ["Java", "Spring Boot", "Microservices", "Kafka", "Oracle", "Docker", "Kubernetes", "Redis", "Android", "iOS"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "1000+"),

            Create("Pathao", "pathao", "https://pathao.com", "https://pathao.com/careers", "https://linkedin.com/company/pathao",
                CompanyCategory.FintechAndHighScale, "Pathao Ride, Food, Courier, Pay, Shop",
                "Leading super-app of Bangladesh engineering high-concurrency microservices, geospatial routing, and payments.",
                ["Go", "Python", "Kubernetes", "Kafka", "PostgreSQL", "React", "Redis", "Docker", "Android", "iOS"], "Dhaka, Bangladesh", "Nepal", "Hybrid", "500-1000"),

            Create("Chaldal", "chaldal", "https://chaldal.com", "https://chaldal.tech", "https://linkedin.com/company/chaldal",
                CompanyCategory.GlobalSaaSAndProduct, "Eggplant OS, Chaldal Consumer App, Automated Warehouse Stack",
                "Pioneering tech company known for building its entire warehouse orchestration engine using functional F# and .NET.",
                ["F#", "C#", ".NET", "React", "TypeScript", "Azure", "Docker", "SQL Server"], "Dhaka, Bangladesh", "Singapore", "Hybrid", "250-500"),

            Create("ShopUp", "shopup", "https://shopup.com.bd", "https://shopup.com.bd/careers", "https://linkedin.com/company/shopup-bd",
                CompanyCategory.FintechAndHighScale, "Mokyaku, RedX Logistics, B2B Commerce Platform",
                "High-growth B2B commerce and supply chain platform empowering micro-merchants across Bangladesh and India.",
                ["Go", "Node.js", "React", "Kubernetes", "PostgreSQL", "Kafka", "Redis", "AWS"], "Dhaka, Bangladesh", "Bengaluru, India", "Hybrid", "500-1000"),

            Create("Bondstein Technologies", "bondstein", "https://bondstein.com", "https://bondstein.com/career", "https://linkedin.com/company/bondstein",
                CompanyCategory.CloudDevOpsAndInfra, "IoT Telematics, Fleet Management, Smart Utility Sensors",
                "Pioneering IoT platform engineering company deploying connected vehicle tracking and industrial telematics.",
                ["Node.js", "Python", "Go", "React", "IoT", "MQTT", "PostgreSQL", "AWS"], "Dhaka, Bangladesh", "Singapore", "Onsite", "100-250"),

            Create("TigerIT Bangladesh", "tigerit-bangladesh", "https://tigerit.com", "https://tigerit.com/careers", "https://linkedin.com/company/tigerit-bangladesh-ltd",
                CompanyCategory.EnterpriseOutsourcing, "Automated Fingerprint Identification System (AFIS), Biometrics, National Identity",
                "Global biometrics and identity infrastructure leader powering national voting and passport systems worldwide.",
                ["Java", "C++", "Python", "Biometrics", "Oracle", "Linux", "Docker", "SQL"], "Dhaka, Bangladesh", "USA", "Onsite", "200-500"),

            // Tier 4: AI, Cloud & Specialized Agencies
            Create("Intelligent Machines", "intelligent-machines", "https://intelligentmachines.tech", "https://intelligentmachines.tech/careers", "https://linkedin.com/company/intelligentmachines",
                CompanyCategory.AIAndDataIntelligence, "Enterprise AI, Computer Vision, Voice & Speech Intelligence",
                "High-end AI & deep learning engineering agency building custom LLM and machine learning products for telecom and banks.",
                ["Python", "PyTorch", "TensorFlow", "FastAPI", "React", "Docker", "Machine Learning", "NLP"], "Dhaka, Bangladesh", "Global", "Hybrid", "50-100"),

            Create("Pioneer Alpha", "pioneer-alpha", "https://pioneeralpha.com", "https://pioneeralpha.com/career", "https://linkedin.com/company/pioneer-alpha",
                CompanyCategory.AIAndDataIntelligence, "Generative AI, Multi-modal RAG, Agentic AI Systems",
                "Cutting-edge AI research and product development company specializing in generative models and autonomous agents.",
                ["Python", "LangChain", "FastAPI", "React", "Docker", "Vector DB", "PyTorch", "Kubernetes"], "Dhaka, Bangladesh", "USA", "Remote", "20-50"),

            Create("LeadSoft Bangladesh", "leadsoft-bd", "https://leads.com.bd", "https://leads.com.bd/career", "https://linkedin.com/company/leadsoft-bangladesh-limited",
                CompanyCategory.EnterpriseOutsourcing, "BankUltimus Core Banking, Enterprise ERP",
                "CMMI Level 3 certified financial software enterprise powering major domestic and regional private banks.",
                ["C#", ".NET", "Java", "Oracle", "SQL Server", "Angular", "FinTech"], "Dhaka, Bangladesh", "Dhaka", "Onsite", "200-500"),

            Create("Shurvid", "shurvid", "https://shurvid.com", "https://shurvid.com/careers", "https://linkedin.com/company/shurvid",
                CompanyCategory.CloudDevOpsAndInfra, "Cloud Migration, Enterprise Microservices Architecture",
                "Cloud-first software consultancy assisting North American SaaS enterprises with architecture and DevOps automation.",
                ["AWS", "Azure", "Docker", "Kubernetes", "Terraform", "Python", "Go", "C#", ".NET"], "Dhaka, Bangladesh", "USA", "Remote", "50-100"),

            Create("Neural Semiconductor", "neural-semiconductor", "https://neuralsemi.com", "https://neuralsemi.com/career", "https://linkedin.com/company/neural-semiconductor-limited",
                CompanyCategory.EnterpriseOutsourcing, "ASIC/VLSI Design, Embedded Firmware, IoT Solutions",
                "High-tech semiconductor and embedded firmware engineering company designing silicon chips for global clients.",
                ["C", "C++", "Verilog", "VHDL", "Embedded Systems", "Linux", "Python"], "Dhaka, Bangladesh", "USA, Japan", "Onsite", "50-100"),

            Create("Quantanite Bangladesh", "quantanite-bd", "https://quantanite.com", "https://quantanite.com/careers", "https://linkedin.com/company/quantanite",
                CompanyCategory.AIAndDataIntelligence, "AI Data Annotation, Automation, Machine Learning Ground Truth",
                "Global customer experience and AI data enablement company supporting worldwide AI product teams.",
                ["Python", "AI Annotation", "Data Engineering", "SQL", "Automation"], "Dhaka, Bangladesh", "London, UK", "Hybrid", "1000+"),

            Create("SEBPO", "sebpo", "https://sebpo.com", "https://sebpo.com/careers", "https://linkedin.com/company/sebpo",
                CompanyCategory.DigitalAgencyAndConsulting, "AdTech Engineering, Digital Media Quality Operations",
                "Top US outsourcing and digital advertising technology partner operating in Dhaka for over 15 years.",
                ["JavaScript", "AdTech", "Python", "SQL", "Cloud Infrastructure"], "Dhaka, Bangladesh", "New Jersey, USA", "Hybrid", "1000+"),

            Create("SSL Wireless (Software Shop Limited)", "ssl-wireless", "https://sslwireless.com", "https://sslwireless.com/career", "https://linkedin.com/company/ssl-wireless",
                CompanyCategory.FintechAndHighScale, "SSLCOMMERZ, SMS Gateway, Enterprise Telecom Value-Added Services",
                "Pioneering digital payments company that launched SSLCOMMERZ, Bangladesh's largest payment gateway.",
                ["PHP", "Java", "Python", "MySQL", "Redis", "Docker", "React", "FinTech"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "250-500"),

            Create("Portonics", "portonics", "https://portonics.com", "https://portonics.com/career", "https://linkedin.com/company/portonics",
                CompanyCategory.DigitalAgencyAndConsulting, "Mobile Apps, Enterprise UI/UX, Consumer Portals",
                "Digital product studio engineering mobile experiences for Grameenphone, Telenor, and top regional brands.",
                ["React", "Node.js", "Flutter", "iOS", "Android", "UI/UX", "AWS"], "Dhaka, Bangladesh", "Singapore", "Hybrid", "100-250"),

            Create("Riseup Labs", "riseup-labs", "https://riseuplabs.com", "https://riseuplabs.com/career", "https://linkedin.com/company/riseuplabs",
                CompanyCategory.DigitalAgencyAndConsulting, "Games, AR/VR, Interactive Web & Mobile Software",
                "ISO-certified creator of mobile games, UNICEF child education interactive portals, and AR/VR solutions.",
                ["Unity", "C#", "React", "Node.js", "Flutter", "iOS", "Android"], "Dhaka, Bangladesh", "USA", "Hybrid", "100-250"),

            Create("Shikho", "shikho", "https://shikho.com", "https://shikho.com/careers", "https://linkedin.com/company/shikho-tech",
                CompanyCategory.GlobalSaaSAndProduct, "Shikho EdTech Engine, Animated Learning, Live Classes",
                "Venture-funded EdTech platform serving millions of students with interactive video engines and testing platforms.",
                ["Node.js", "React", "React Native", "Flutter", "AWS", "MongoDB", "PostgreSQL"], "Dhaka, Bangladesh", "Singapore", "Hybrid", "100-250"),

            Create("10 Minute School", "10-minute-school", "https://10minuteschool.com", "https://10minuteschool.com/careers", "https://linkedin.com/company/10ms",
                CompanyCategory.GlobalSaaSAndProduct, "10MS Learning Platform, Live Streaming & Exam Engine",
                "Bangladesh's largest EdTech platform with high-concurrency video streaming, automated grading, and mobile apps.",
                ["Node.js", "React", "Python", "AWS", "PostgreSQL", "Docker", "Redis", "Flutter"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "200-500"),

            Create("Jatri", "jatri", "https://jatri.co", "https://jatri.co/careers", "https://linkedin.com/company/jatri",
                CompanyCategory.FintechAndHighScale, "Jatri Public Transport Ticketing, Fleet Telematics",
                "Leading mobility platform modernizing urban bus ticketing and inter-district transportation logistics.",
                ["Python", "Go", "React Native", "React", "PostgreSQL", "Docker", "AWS"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "100-250"),

            Create("Truck Lagbe", "truck-lagbe", "https://trucklagbe.com", "https://trucklagbe.com/careers", "https://linkedin.com/company/truck-lagbe",
                CompanyCategory.FintechAndHighScale, "Truck Lagbe Logistics Marketplace, Dynamic Freight Matching",
                "Pioneering digital logistics platform connecting nationwide commercial truck owners and enterprise shippers.",
                ["Node.js", "React", "React Native", "PostgreSQL", "AWS", "Docker", "Redis"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "100-250"),

            Create("Arogga", "arogga", "https://arogga.com", "https://arogga.com/careers", "https://linkedin.com/company/arogga",
                CompanyCategory.GlobalSaaSAndProduct, "Arogga Healthcare & Pharmacy Platform",
                "High-growth digital healthcare platform offering prescription fulfillment, lab testing, and health records.",
                ["Node.js", "React", "Flutter", "AWS", "MongoDB", "Redis"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "100-250"),

            Create("Maya Digital Health", "maya-digital-health", "https://maya.com.bd", "https://maya.com.bd/careers", "https://linkedin.com/company/mayabd",
                CompanyCategory.AIAndDataIntelligence, "Maya Telemedicine & Anonymous Health AI",
                "Award-winning anonymous digital health portal leveraging NLP algorithms to connect users with certified doctors.",
                ["Python", "Django", "React", "NLP", "Machine Learning", "PostgreSQL", "AWS"], "Dhaka, Bangladesh", "Singapore", "Hybrid", "50-100"),

            Create("ShareTrip", "sharetrip", "https://sharetrip.net", "https://sharetrip.net/careers", "https://linkedin.com/company/sharetrip",
                CompanyCategory.GlobalSaaSAndProduct, "ShareTrip Online Travel Agency (OTA), Flight/Hotel GDS Engine",
                "Leading online travel technology platform integrating airline global distribution systems and payment engines.",
                ["PHP", "Laravel", "Vue", "React", "MySQL", "AWS", "Redis"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "100-250"),

            Create("Samsung R&D Institute Bangladesh (SRBD)", "samsung-rnd-bd", "https://research.samsung.com/srbd", "https://research.samsung.com/srbd", "https://linkedin.com/company/srbd",
                CompanyCategory.EnterpriseOutsourcing, "Samsung Tizen OS, Smart TV Apps, AI Camera, Wearable Software",
                "Global R&D wing of Samsung Electronics developing core system software for Galaxy smartphones, Smart TVs, and AI.",
                ["C++", "Java", "Python", "Android", "Linux", "AI", "Machine Learning", "Embedded Systems"], "Dhaka, Bangladesh", "Suwon, South Korea", "Onsite", "500-1000"),

            Create("Walton Software R&D", "walton-software-rnd", "https://waltonbd.com", "https://waltonbd.com/careers", "https://linkedin.com/company/walton-hi-tech-industries-plc",
                CompanyCategory.EnterpriseOutsourcing, "Smart Appliance IoT, Smart TV Android OS, Walton Cloud",
                "Electronics giant software division developing customized Android smart TV firmware and industrial IoT platforms.",
                ["C++", "Android", "Java", "Python", "IoT", "Linux", "Node.js"], "Gazipur/Dhaka, Bangladesh", "Bangladesh", "Onsite", "250-500"),

            Create("BRAC IT Services (BITS)", "brac-it-services", "https://bracits.com", "https://bracits.com/careers", "https://linkedin.com/company/brac-it-services-limited",
                CompanyCategory.EnterpriseOutsourcing, "BRAC Microfinance Core, Global NGO Operations Portal",
                "Technology subsidiary of BRAC (world's #1 NGO), driving social impact engineering across 11 developing nations.",
                ["C#", ".NET", "Java", "SQL Server", "Oracle", "Angular", "React", "Azure"], "Dhaka, Bangladesh", "Uganda, Tanzania, Rwanda", "Hybrid", "250-500"),

            Create("Synesis IT", "synesis-it", "https://synesisit.com.bd", "https://synesisit.com.bd/career", "https://linkedin.com/company/synesis-it-ltd",
                CompanyCategory.EnterpriseOutsourcing, "National Health Line (16263), Citizen Service e-Governance",
                "National award-winning IT company implementing large-scale government digitization and enterprise portals.",
                ["Java", "PHP", "C#", ".NET", "Oracle", "MySQL", "Angular", "Docker"], "Dhaka, Bangladesh", "Bangladesh", "Onsite", "250-500"),

            Create("ADN Diginet", "adn-diginet", "https://adndiginet.com", "https://adndiginet.com/career", "https://linkedin.com/company/adn-diginet",
                CompanyCategory.DigitalAgencyAndConsulting, "Enterprise ERP, Cloud Infrastructure, Telecommunications",
                "Technology wing of ADN Group delivering mission-critical enterprise networking and web solutions.",
                ["PHP", "Laravel", "React", "Node.js", "MySQL", "AWS", "Linux"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "100-250"),

            Create("Genex Infosys", "genex-infosys", "https://genexinfosys.com", "https://genexinfosys.com/career", "https://linkedin.com/company/genexinfosys",
                CompanyCategory.DigitalAgencyAndConsulting, "National NBR VAT Automation, Enterprise Customer Experience",
                "Publicly listed digital transformation powerhouse powering national revenue automation and enterprise CRM.",
                ["C#", ".NET", "Java", "SQL Server", "Oracle", "React", "Docker"], "Dhaka, Bangladesh", "Malaysia, Thailand", "Hybrid", "1000+"),

            Create("Bdtask Limited", "bdtask", "https://bdtask.com", "https://bdtask.com/career", "https://linkedin.com/company/bdtask",
                CompanyCategory.GlobalSaaSAndProduct, "Hospital Management System, Restaurant POS, Multi-Store eCommerce",
                "Top Envato Power Elite Author providing turn-key business software to 10,000+ clients across 100+ countries.",
                ["PHP", "CodeIgniter", "Laravel", "Vue", "JavaScript", "MySQL", "Flutter"], "Dhaka, Bangladesh", "Global", "Onsite", "100-250"),

            Create("Ulka Games", "ulka-games", "https://ulkagames.com", "https://ulkagames.com/career", "https://linkedin.com/company/ulkagames",
                CompanyCategory.GlobalSaaSAndProduct, "Ludo Club, Board & Casual Mobile Games",
                "Moonfrog Labs subsidiary building viral mobile board games enjoyed by over 100 million players across South Asia.",
                ["Unity", "C#", "C++", "Node.js", "AWS", "Redis", "Android", "iOS"], "Dhaka, Bangladesh", "Bengaluru, India", "Hybrid", "50-100"),

            Create("Battery Low Interactive", "battery-low-interactive", "https://batterylowinteractive.com", "https://batterylowinteractive.com/career", "https://linkedin.com/company/battery-low-interactive",
                CompanyCategory.DigitalAgencyAndConsulting, "AR, VR, Metaverse Solutions, Educational Simulators",
                "Interactive engineering studio building virtual reality flight and medical simulators and immersive apps.",
                ["Unity", "Unreal Engine", "C#", "C++", "3D Modeling", "AR/VR"], "Dhaka, Bangladesh", "Bangladesh", "Onsite", "50-100"),

            Create("Dcastalia Limited", "dcastalia", "https://dcastalia.com", "https://dcastalia.com/career", "https://linkedin.com/company/dcastalia",
                CompanyCategory.DigitalAgencyAndConsulting, "Custom Enterprise Portals, Headless CMS, Web Systems",
                "15+ years established software studio designing bespoke web applications and platforms for top national brands.",
                ["PHP", "Laravel", "React", "Vue", "MySQL", "PostgreSQL", "AWS"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "50-100"),

            Create("SoftBD Limited", "softbd-ltd", "https://softbdltd.com", "https://softbdltd.com/career", "https://linkedin.com/company/softbd-ltd",
                CompanyCategory.EnterpriseOutsourcing, "e-Governance, Land Records Management, Ministry Portals",
                "Key technical developer of national digital land transformation and public examination result portals.",
                ["Java", "PHP", "Oracle", "MySQL", "JavaScript", "HTML5", "Linux"], "Dhaka, Bangladesh", "Bangladesh", "Onsite", "100-250"),

            Create("Nascenia", "nascenia", "https://nascenia.com", "https://nascenia.com/careers", "https://linkedin.com/company/nascenia",
                CompanyCategory.EnterpriseOutsourcing, "Ruby on Rails, Mobile Applications, Cloud Platforms",
                "European award-winning software engineering firm renowned for modern Ruby on Rails and React development.",
                ["Ruby on Rails", "React", "PostgreSQL", "Node.js", "Docker", "AWS", "Mobile"], "Dhaka, Bangladesh", "Europe, USA", "Hybrid", "50-100"),

            Create("Craftman", "craftman", "https://craftman.co", "https://craftman.co/careers", "https://linkedin.com/company/craftmanco",
                CompanyCategory.DigitalAgencyAndConsulting, "UX-led Web & Mobile Applications for Global Startups",
                "Boutique digital product studio crafting delightful software experiences for Y-Combinator and Techstars founders.",
                ["React", "Next.js", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL", "Figma"], "Dhaka, Bangladesh", "USA", "Hybrid", "20-50"),

            Create("Aamra Technologies", "aamra-technologies", "https://aamratechnologies.com", "https://aamratechnologies.com/career", "https://linkedin.com/company/aamra-technologies-limited",
                CompanyCategory.CloudDevOpsAndInfra, "Banking IT Infrastructure, ATM Networks, Cloud Connectivity",
                "Pioneering technology provider delivering core financial hardware, data center solutions, and networks.",
                ["Networking", "Cisco", "Linux", "Windows Server", "SQL Server", "Cloud Infrastructure"], "Dhaka, Bangladesh", "Bangladesh", "Onsite", "250-500"),

            Create("TechnoVista Limited", "technovista", "https://technovista.com.bd", "https://technovista.com.bd/careers", "https://linkedin.com/company/technovista-limited",
                CompanyCategory.EnterpriseOutsourcing, "Health Informatics, UN Agencies Management Software",
                "Established software engineering agency delivering global public health database systems across South Asia.",
                ["C#", ".NET", "Java", "SQL Server", "Oracle", "Angular", "Web Services"], "Dhaka, Bangladesh", "Bangladesh", "Hybrid", "100-250"),

            Create("IBCS-PRIMAX Software", "ibcs-primax", "https://ibcs-primax.com", "https://ibcs-primax.com/career", "https://linkedin.com/company/ibcs-primax-software-bangladesh-ltd",
                CompanyCategory.EnterpriseOutsourcing, "Oracle Partner Core Systems, Defense & Government Portals",
                "Leading enterprise systems integrator and corporate Oracle competency center in Bangladesh.",
                ["Java", "Oracle", "C#", ".NET", "SQL", "Linux", "Enterprise Architecture"], "Dhaka, Bangladesh", "UK", "Onsite", "100-250"),

            Create("Southtech Limited", "southtech-group", "https://southtechgroup.com", "https://southtechgroup.com/career", "https://linkedin.com/company/southtech-limited",
                CompanyCategory.EnterpriseOutsourcing, "Ascent Financial Suite, HRIS, Microfinance Banking",
                "CMMI Level 5 software house with 28+ years of experience engineering core financial systems globally.",
                ["Java", "C#", ".NET", "SQL Server", "Oracle", "Angular", "Cloud"], "Dhaka, Bangladesh", "UK, USA, Bhutan, Myanmar", "Onsite", "100-250")
        ];
    }

    private static BdTechCompany Create(
        string name,
        string slug,
        string website,
        string careersUrl,
        string? linkedInUrl,
        CompanyCategory category,
        string products,
        string description,
        string[] techStack,
        string hq,
        string offices,
        string workModel,
        string employees)
    {
        return new BdTechCompany
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug,
            Website = website,
            CareersUrl = careersUrl,
            LinkedInUrl = linkedInUrl,
            Category = category,
            GlobalProducts = products,
            Description = description,
            PrimaryTechStackJson = JsonSerializer.Serialize(techStack),
            Headquarters = hq,
            GlobalOffices = offices,
            WorkModel = workModel,
            EmployeeCountRange = employees,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };
    }
}
