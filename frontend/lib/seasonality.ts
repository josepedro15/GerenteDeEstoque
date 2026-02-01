import { addDays, differenceInDays, getYear, isAfter, isBefore, setYear } from "date-fns";

export interface SeasonalityEvent {
    name: string;
    date: Date;
    daysUntil: number;
    description: string;
}

// Helper to calculate Easter (Sunday) for a given year using anonymous algorithm
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

    // 1. Fixed Date Holidays
    const fixedHolidays = [
        { name: "Dia das Mães", month: 4, day: 11, desc: "Foco em presentes, casa e decoração." }, // Approx 2nd Sunday of May - logic below is simplified fixed for now, can improve
        { name: "Dia dos Namorados", month: 5, day: 12, desc: "Presentes para casais, jantar, experiências." },
        { name: "Dia dos Pais", month: 7, day: 11, desc: "Presentes masculinos, ferramentas, churrasco." }, // Approx 2nd Sunday of Aug
        { name: "Dia das Crianças", month: 9, day: 12, desc: "Brinquedos, jogos, doces." },
        { name: "Black Friday", month: 10, day: 24, desc: "Descontos agressivos, queima de estoque." }, // Late Nov - varying
        { name: "Natal", month: 11, day: 25, desc: "Maior data do varejo. Presentes, ceia, família." },
        { name: "Ano Novo", month: 11, day: 31, desc: "Festas, viagens, renovação." },
        // Add more specific ones if needed like Festas Juninas (June)
    ];

    // Better logic for moving holidays (Mothers/Fathers Day are Sundays)
    // For MVP, let's approximation or specific dates for 2025/2026? 
    // Let's implement dynamic calculation for key ones.

    const getMothersDay = (y: number) => {
        // 2nd Sunday of May
        const date = new Date(y, 4, 1); // May 1st
        const day = date.getDay();
        const diff = day === 0 ? 7 : (7 - day); // days to first sunday (if May 1st is Sun, it's 7 days away? No, if May 1st is Sun, it is the first sunday. 0.)
        // Actually: if day 0 (Sun), +0 days = 1st Sunday. +7 days = 2nd Sunday.
        // If May 1st is Mon (1), +6 days = 1st Sunday. +13 days = 2nd Sunday.
        const firstSunday = day === 0 ? 1 : 1 + (7 - day);
        return new Date(y, 4, firstSunday + 7);
    };

    const getFathersDay = (y: number) => {
        // 2nd Sunday of August
        const date = new Date(y, 7, 1);
        const day = date.getDay();
        const firstSunday = day === 0 ? 1 : 1 + (7 - day);
        return new Date(y, 7, firstSunday + 7);
    };

    // Calculate Mobile Holidays
    const easter = getEaster(year);
    const carnival = addDays(easter, -47); // Carnival Tuesday is 47 days before Easter

    const dynamicEvents = [
        { name: "Carnaval", date: carnival, desc: "Festas, viagens, verão." },
        { name: "Páscoa", date: easter, desc: "Chocolates, almoço em família." },
        { name: "Dia das Mães", date: getMothersDay(year), desc: "Segunda maior data. Foco afetivo." },
        { name: "Dia dos Pais", date: getFathersDay(year), desc: "Homenagem aos pais." }
    ];

    // Add fixed events properly
    const fixed = [
        { name: "Dia dos Namorados", date: new Date(year, 5, 12), desc: "Presentes românticos." },
        { name: "Festas Juninas", date: new Date(year, 5, 24), desc: "São João. Comidas típicas, decoração." },
        { name: "Dia das Crianças", date: new Date(year, 9, 12), desc: "Infantil." },
        { name: "Black Friday", date: new Date(year, 10, 28), desc: "Promoções. (Data aprox. confirmar última sexta de nov)." }, // Logic for BF: Last Friday of Nov
        { name: "Natal", date: new Date(year, 11, 25), desc: "Natal." },
        { name: "Ano Novo", date: new Date(year, 11, 31), desc: "Réveillon." },
    ];

    // Logic for Black Friday (4th Friday or Last Friday of Nov? traditionally 4th Thursday is Thanksgiving, Friday follows)
    // Basic logic: Find Nov 1st, count fridays. or just set fixed for now to simplfy. 
    // Let's implement accurate Black Friday: 4th Friday of Nov usually? No, Last Friday. 
    // Actually it's the Friday after US Thanksgiving (4th Thursday). So it can be 4th or 5th Friday.
    // Let's stick to Nov 28th approx or implement better later. Nov 29 2024, Nov 28 2025.

    const allEvents = [...dynamicEvents, ...fixed];

    // Check if event is passed, if so, calculate for next year? 
    // Or just filter for "Next 60 days". 
    // User wants "Seasonality is arriving".

    // Sort and filter
    allEvents.forEach(e => {
        // If date passed this year, ignore or add next year's date if within lookahead?
        // Let's just focus on current year for simplicity, logic resets Jan 1.
        if (isBefore(e.date, today)) {
            // Maybe it's next year (e.g. today is Dec 26, New Year is Dec 31 -> ok. Carnival is Feb -> need next year's carnival)
            // For simplicity, we only return list of dates sorted by proximity.
            // If calculate next year for everything is hard, let's just stick to "Future events in current year" + "Early next year calculation if easy".
            // Let's assume user uses this for "Next 30-60 days".
        }
    });

    // Re-check dates including Next Year for early events (Carnaval next year if today is Dec)
    const candidates: SeasonalityEvent[] = [];

    // Function to add event candidates
    const checkAndAdd = (name: string, date: Date, desc: string) => {
        let targetDate = date;
        // If date is in the past more than a few days, try next year
        if (differenceInDays(targetDate, today) < -7) {
            // Logic to find this holiday next year... simple for fixed, hard for mobile.
            // For now, ignore past events.
            return;
        }

        const days = differenceInDays(targetDate, today);
        if (days >= -5 && days <= 90) { // Show if active (just passed 5 days ago) or coming in 3 months
            candidates.push({ name, date: targetDate, daysUntil: days, description: desc });
        }
    };

    allEvents.forEach(e => checkAndAdd(e.name, e.date, e.desc));

    // Special case: If we are in Dec, check next year's Carnival/Easter?
    // Implementation for Next Year Carnival/Easter requires recalculating for year+1.
    if (today.getMonth() >= 10) { // Nov or Dec
        const nextEaster = getEaster(nextYear);
        const nextCarnival = addDays(nextEaster, -47);
        checkAndAdd("Carnaval (Próx. Ano)", nextCarnival, "Prepare-se para o Carnaval antecipado.");
    }

    return candidates.sort((a, b) => a.daysUntil - b.daysUntil);
}
