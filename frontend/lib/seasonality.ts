import { addDays, differenceInDays, getYear, setYear } from "date-fns";

export interface SeasonalityEvent {
    name: string;
    date: Date;
    daysUntil: number;
    description: string;
}

function getEaster(year: number): Date {
    const f = Math.floor,
        G = year % 19,
        C = f(year / 100),
        H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
        I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
        J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
        L = I - J,
        month = 3 + f((L + 40) / 44),
        day = L + 28 - 31 * f(month / 4);

    return new Date(year, month - 1, day);
}

export function getUpcomingSeasonality(today: Date = new Date()): SeasonalityEvent[] {
    const year = getYear(today);
    const nextYear = year + 1;
    const events: SeasonalityEvent[] = [];

    const getMothersDay = (y: number) => {
        const date = new Date(y, 4, 1);
        const day = date.getDay();
        const firstSunday = day === 0 ? 1 : 1 + (7 - day);
        return new Date(y, 4, firstSunday + 7);
    };

    const getFathersDay = (y: number) => {
        const date = new Date(y, 7, 1);
        const day = date.getDay();
        const firstSunday = day === 0 ? 1 : 1 + (7 - day);
        return new Date(y, 7, firstSunday + 7);
    };

    const easter = getEaster(year);
    const carnival = addDays(easter, -47);

    const dynamicEvents = [
        { name: "Carnaval", date: carnival, desc: "Festas, viagens, verão." },
        { name: "Páscoa", date: easter, desc: "Chocolates, almoço em família." },
        { name: "Dia das Mães", date: getMothersDay(year), desc: "Segunda maior data. Foco afetivo." },
        { name: "Dia dos Pais", date: getFathersDay(year), desc: "Homenagem aos pais." }
    ];

    const fixed = [
        { name: "Dia dos Namorados", date: new Date(year, 5, 12), desc: "Presentes românticos." },
        { name: "Festas Juninas", date: new Date(year, 5, 24), desc: "São João. Comidas típicas, decoração." },
        { name: "Dia das Crianças", date: new Date(year, 9, 12), desc: "Infantil." },
        { name: "Black Friday", date: new Date(year, 10, 28), desc: "Promoções." },
        { name: "Natal", date: new Date(year, 11, 25), desc: "Natal." },
        { name: "Ano Novo", date: new Date(year, 11, 31), desc: "Réveillon." },
    ];

    const allEvents = [...dynamicEvents, ...fixed];

    const candidates: SeasonalityEvent[] = [];

    const checkAndAdd = (name: string, date: Date, desc: string) => {
        const targetDate = date;
        if (differenceInDays(targetDate, today) < -7) {
            return;
        }

        const days = differenceInDays(targetDate, today);
        if (days >= -5 && days <= 90) {
            candidates.push({ name, date: targetDate, daysUntil: days, description: desc });
        }
    };

    allEvents.forEach(e => checkAndAdd(e.name, e.date, e.desc));

    if (today.getMonth() >= 10) {
        const nextEaster = getEaster(nextYear);
        const nextCarnival = addDays(nextEaster, -47);
        checkAndAdd("Carnaval (Próx. Ano)", nextCarnival, "Prepare-se para o Carnaval antecipado.");
    }

    return candidates.sort((a, b) => a.daysUntil - b.daysUntil);
}
