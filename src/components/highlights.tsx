import {
    Block,
    BlockTitle,
    Card,
    Link,
    Navbar,
    Page,
    Popup,
    Preloader
} from 'konsta/react';
import { CircleX } from 'lucide-react';
import React from 'react';
import { useAstroStore } from '../store/astroStore';

interface Highlight {
    title: string;
    detail: string;
}

const PLANET_OPTIONS = [
    { title: 'Retrograde Alert', color: 'text-purple-800', backgroundColor: 'bg-purple-50', borderColor: 'inset-ring px-2 py-1 inset-ring-purple-800/20' },
    { title: 'Combust Alert', color: 'text-red-800', backgroundColor: 'bg-red-50', borderColor: 'inset-ring px-2 py-1 inset-ring-red-800/20' },
    { title: 'Moon Sign', color: 'text-grey-200', backgroundColor: 'bg-grey-50', borderColor: 'inset-ring px-2 py-1 inset-ring-grey-200/20' },
    { title: 'Sun Sign', color: 'text-orange-800', backgroundColor: 'bg-orange-50', borderColor: 'inset-ring px-2 py-1 inset-ring-orange-800/20' },
    { title: 'Atmakaraka', color: 'text-purple-400', backgroundColor: 'bg-purple-50', borderColor: 'inset-ring px-2 py-1 inset-ring-purple-400/20' },
    { title: 'Darakaraka', color: 'text-red-400', backgroundColor: 'bg-red-50', borderColor: 'inset-ring px-2 py-1 inset-ring-red-400/20' },
    { title: 'Conjunctions', color: 'text-orange-500', backgroundColor: 'bg-orange-50', borderColor: 'inset-ring px-2 py-1 inset-ring-orange-500/20' },
    { title: 'Yogakaraka', color: 'text-green-500', backgroundColor: 'bg-green-50', borderColor: 'inset-ring px-2 py-1 inset-ring-green-500/20' },
]

export const PlanetaryHighlights = () => {
    const { planets, loading, error, fetchAstroData } = useAstroStore();
    const [highlights, setHighlights] = React.useState<Highlight[]>([]);
    const [showYogakarakaModal, setShowYogakarakaModal] = React.useState(false);
    const [showAtmakarakaModal, setShowAtmakarakaModal] = React.useState(false);
    const [showDarakarakaModal, setShowDarakarakaModal] = React.useState(false);
    const [showConjunctionsModal, setShowConjunctionsModal] = React.useState(false);
    const [showRetrogradeModal, setShowRetrogradeModal] = React.useState(false);
    const [showCombustModal, setShowCombustModal] = React.useState(false);

    React.useEffect(() => {
        if (!planets && !loading && !error) {
            fetchAstroData();
        }
    }, [planets, loading, error, fetchAstroData]);

    React.useEffect(() => {
        if (planets) {
            const newHighlights: Highlight[] = [];
            const planetEntries = Object.entries(planets);

            // 1. Retrograde Alert
            const retroPlanets = planetEntries
                .filter(
                    ([name, data]: any) =>
                        data.isRetro === 'true' && name !== 'Rahu' && name !== 'Ketu',
                )
                .map(([name]) => name);
            if (retroPlanets.length > 0) {
                newHighlights.push({
                    title: 'Retrograde Alert',
                    detail: `${retroPlanets.join(', ')} ${retroPlanets.length > 1 ? 'are' : 'is'} currently retrograde in your chart.`,
                });
            }

            // 2. Combust Alert
            const sun: any = planets.Sun;
            if (sun) {
                const sunDegree = sun.fullDegree;
                const thresholds: Record<string, number> = {
                    Moon: 12,
                    Mars: 17,
                    Mercury: planets.Mercury?.isRetro === 'true' ? 12 : 14,
                    Jupiter: 11,
                    Venus: planets.Venus?.isRetro === 'true' ? 8 : 10,
                    Saturn: 15,
                };

                const combustPlanets = Object.entries(thresholds)
                    .filter(([name, threshold]) => {
                        const p: any = planets[name];
                        if (!p) return false;
                        const diff = Math.abs(p.fullDegree - sunDegree);
                        const distance = Math.min(diff, 360 - diff);
                        return distance < threshold;
                    })
                    .map(([name]) => name);

                if (combustPlanets.length > 0) {
                    newHighlights.push({
                        title: 'Combust Alert',
                        detail: `${combustPlanets.join(', ')} ${combustPlanets.length > 1 ? 'are' : 'is'} combust (too close to the Sun).`,
                    });
                }
            }

            // 3. Sun & Moon Sign
            const zodiacSigns = [
                'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
            ];
            if (sun) {
                newHighlights.push({
                    title: 'Sun Sign',
                    detail: `Your Sun is in ${sun.zodiac_sign_name || zodiacSigns[sun.current_sign - 1]}.`,
                });
            }
            if (planets.Moon) {
                newHighlights.push({
                    title: 'Moon Sign',
                    detail: `Your Moon is in ${planets.Moon.zodiac_sign_name || zodiacSigns[planets.Moon.current_sign - 1]}.`,
                });
            }

            // 4. Jaimini Karakas (Atmakaraka & Darakaraka)
            const majorPlanets = [
                'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn',
            ]
                .map((name) => ({ name, degree: (planets[name]?.normDegree || 0) % 30 }))
                .sort((a, b) => b.degree - a.degree);

            if (majorPlanets.length >= 7) {
                newHighlights.push({
                    title: 'Atmakaraka',
                    detail: `${majorPlanets[0].name} is your soul planet (Atmakaraka), holding the highest degree.`,
                });
                newHighlights.push({
                    title: 'Darakaraka',
                    detail: `${majorPlanets[6].name} is your spouse planet (Darakaraka), holding the lowest degree.`,
                });
            }

            // 5. Yogakaraka
            const ascSign = planets?.Ascendant?.current_sign;
            const yogakarakaMap: Record<number, { name: string; houses: string }> = {
                2: { name: 'Saturn', houses: '9th & 10th' }, // Taurus: 9 & 10
                4: { name: 'Mars', houses: '5th & 10th' }, // Cancer: 5 & 10
                5: { name: 'Mars', houses: '4th & 9th' }, // Leo: 4 & 9
                7: { name: 'Saturn', houses: '4th & 5th' }, // Libra: 4 & 5
                10: { name: 'Venus', houses: '5th & 10th' }, // Capricorn: 5 & 10
                11: { name: 'Venus', houses: '4th & 9th' }, // Aquarius: 4 & 9
            };
            const yk = yogakarakaMap[ascSign];
            if (yk) {
                newHighlights.push({
                    title: 'Yogakaraka',
                    detail: `${yk.name} is your Yogakaraka planet, ruling your ${yk.houses} houses. It brings immense luck and power.`,
                });
            }

            // 6. Conjunctions (Planets in same house)
            const houseMap: Record<number, string[]> = {};
            planetEntries.forEach(([name, data]: any) => {
                const house = data.house_number || 1;
                if (!houseMap[house]) houseMap[house] = [];
                houseMap[house].push(name);
            });

            const conjunctions = Object.entries(houseMap)
                .filter(([, planetsInHouse]) => planetsInHouse.length > 1)
                .map(([house, planetsInHouse]) => `${planetsInHouse.join(' & ')} in House ${house}`);

            if (conjunctions.length > 0) {
                newHighlights.push({
                    title: 'Conjunctions',
                    detail: `Key planetary pairings: ${conjunctions.join('; ')}.`,
                });
            }

            setHighlights(newHighlights);
        }
    }, [planets]);

    if (loading) {
        return (
            <Block className="flex justify-center py-4">
                <Preloader />
            </Block>
        );
    }

    if (highlights.length === 0) return null;

    return (
        <Card className='border border-gray-300 rounded-lg'>
            <div className="px-4 py-2">
                <BlockTitle className="m-0! mb-2! uppercase text-xs font-bold tracking-wider text-gray-500">Planetary Highlights</BlockTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {highlights.map((h, i) => {
                        const option = PLANET_OPTIONS.find((o) => o.title === h.title);
                        if (!option) return null;
                        return (
                            <Card key={i} className={`m-0! border border-gray-100 shadow-sm rounded-xl bg-white p-4 ${option.backgroundColor} ${option.borderColor}`}>
                                <div className="flex flex-col gap-1">
                                    <span className={`text-xs font-bold ${option.color} uppercase tracking-tight`}>{h.title}</span>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{h.detail}</p>
                                    {h.title === 'Retrograde Alert' && (
                                        <Link
                                            className="k-color-brand-primary text-sm mt-1 inline-block"
                                            onClick={() => setShowRetrogradeModal(true)}
                                        >
                                            Read More
                                        </Link>
                                    )}
                                    {h.title === 'Combust Alert' && (
                                        <Link
                                            className="k-color-brand-primary text-sm mt-1 inline-block"
                                            onClick={() => setShowCombustModal(true)}
                                        >
                                            Read More
                                        </Link>
                                    )}
                                    {h.title === 'Atmakaraka' && (
                                        <Link
                                            className="k-color-brand-primary text-sm mt-1 inline-block"
                                            onClick={() => setShowAtmakarakaModal(true)}
                                        >
                                            Read More
                                        </Link>
                                    )}
                                    {h.title === 'Darakaraka' && (
                                        <Link
                                            className="k-color-brand-primary text-sm mt-1 inline-block"
                                            onClick={() => setShowDarakarakaModal(true)}
                                        >
                                            Read More
                                        </Link>
                                    )}
                                    {h.title === 'Yogakaraka' && (
                                        <Link
                                            className="k-color-brand-primary text-sm mt-1 inline-block"
                                            onClick={() => setShowYogakarakaModal(true)}
                                        >
                                            Read More
                                        </Link>
                                    )}
                                    {h.title === 'Conjunctions' && (
                                        <Link
                                            className="k-color-brand-primary text-sm mt-1 inline-block"
                                            onClick={() => setShowConjunctionsModal(true)}
                                        >
                                            Read More
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
            <Popup
                opened={showCombustModal}
                onBackdropClick={() => setShowCombustModal(false)}
            >
                <Page>
                    <Navbar
                        title="Combust (Astangata) Explained"
                        right={<></>}
                    >
                        <button onClick={() => setShowCombustModal(false)} className="w-4 cursor-pointer"><CircleX /></button>
                    </Navbar>
                    <Block className="text-sm text-gray-700">
                        <p className='mb-2'>
                            In Vedic astrology, a planet is called <strong>Combust</strong> (or <strong>Astangata</strong>) when it gets too close to the Sun.
                        </p>
                        <p className='mb-2 italic'>
                            Think of the Sun as a massive, blinding spotlight. When a planet stands right next to it, the planet’s own "light" or external influence is swallowed up by the Sun’s brilliance. While the planet is still there and its internal strength remains, it struggles to project its energy into the physical world.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>1. The "Burning" Degrees</h4>
                        <p className='mb-2'>
                            Each planet has a specific "danger zone" (measured in degrees) near the Sun. If it falls within this range, it is considered combust.
                        </p>
                        <div className='overflow-x-auto mb-4'>
                            <table className='min-w-full divide-y divide-gray-200 text-xs'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Planet</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Range from Sun (Approx)</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    <tr><td className='px-2 py-1 font-bold'>Moon</td><td className='px-2 py-1'>Within 12°</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Mars</td><td className='px-2 py-1'>Within 17°</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Mercury</td><td className='px-2 py-1'>Within 14° (12° if Retrograde)</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Jupiter</td><td className='px-2 py-1'>Within 11°</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Venus</td><td className='px-2 py-1'>Within 10° (8° if Retrograde)</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Saturn</td><td className='px-2 py-1'>Within 15°</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4 className='font-bold mt-3 mb-1'>2. What Happens to a Combust Planet?</h4>
                        <p className='mb-2'>
                            When a planet is combust, it is effectively "eclipsed" by the ego and soul (the Sun).
                        </p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Loss of External Results:</strong> You might have the talent, but the world doesn't "see" it easily. A combust Venus might give deep artistic talent, but difficulty finding public appreciation.</li>
                            <li><strong>The "Sun" Takes Over:</strong> The planet’s energy begins to serve the Sun’s agenda (authority, ego, soul's purpose).</li>
                            <li><strong>Internalization:</strong> The qualities become very private. A combust Mercury may be brilliant but find it difficult to express thoughts verbally in crowds.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>3. The Exception: "Cazimi" (In the Heart of the Sun)</h4>
                        <p className='mb-2'>
                            There is a rare state where a planet is extremely close to the Sun—usually within <strong>0° and 1°</strong>.
                        </p>
                        <p className='mb-2'>
                            While still technically combust, some believe the planet is "purified" or "enthroned." The person may gain extraordinary intelligence (Mercury), wealth (Jupiter/Venus), or discipline (Saturn) because the planet is sitting in the "King's lap."
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>4. Specific Effects of Combustion</h4>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Combust Mercury:</strong> Can lead to a "burnt" intellect—very sharp but perhaps overly sensitive or prone to nervous tension.</li>
                            <li><strong>Combust Venus:</strong> Often indicates "sacrificial love" or hidden relationships; beauty that is deeply soul-stirring but non-standard.</li>
                            <li><strong>Combust Jupiter:</strong> May cause unconventional beliefs or difficulty with traditional teachers and "established" luck.</li>
                            <li><strong>Combust Saturn:</strong> Can create a feeling that one’s hard work is never noticed by authority figures.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>5. Is it always "Bad"?</h4>
                        <p className='mb-2'>
                            Not at all. Combustion is often misunderstood as "the planet is dead." It is not dead; it is <strong>hidden</strong>.
                        </p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Spiritually:</strong> Excellent. It forces the person to stop looking for external validation and look within.</li>
                            <li><strong>Materially:</strong> Can be frustrating. You may work twice as hard for half the credit as the Sun "steals" the spotlight.</li>
                        </ul>

                        <p className='italic mt-2'>
                            <strong>Crucial Tip:</strong> Check if the combust planet is your Yogakaraka or Atmakaraka. If your soul planet (AK) is combust, your life journey is deeply focused on stripping away the ego to find your true self.
                        </p>
                    </Block>
                </Page>
            </Popup>
            <Popup
                opened={showRetrogradeModal}
                onBackdropClick={() => setShowRetrogradeModal(false)}
            >
                <Page>
                    <Navbar
                        title="Retrograde (Vakra) Explained"
                        right={<></>}
                    >
                        <button onClick={() => setShowRetrogradeModal(false)} className="w-4 cursor-pointer"><CircleX /></button>
                    </Navbar>
                    <Block className="text-sm text-gray-700">
                        <p className='mb-2'>
                            In Vedic astrology, a retrograde planet is called <strong>Vakra</strong> (meaning "twisted" or "indirect").
                        </p>
                        <p className='mb-2 italic'>
                            When a planet is retrograde, it appears to be moving backward from our perspective on Earth. While it’s an optical illusion in astronomy, in astrology, it signifies a planet that is unusually close to Earth, making its energy feel "louder," more intense, and deeply internalized.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>1. The "Chesta Bala" (The Power of Effort)</h4>
                        <p className='mb-2'>
                            Retrograde planets are considered to have high <strong>Chesta Bala</strong> (motivational strength).
                            <br />
                            <strong>The Logic:</strong> Because the planet is closer to Earth, it exerts a stronger gravitational and "karmic" pull.
                            <br />
                            <strong>The Result:</strong> A retrograde planet is "strong," but that strength isn't always easy to use. It’s like a car with a massive engine but a very sensitive steering wheel—it has power, but it requires more effort to control.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>2. The Psychology: Looking Inward</h4>
                        <p className='mb-2'>
                            A direct planet moves forward and acts upon the world. A retrograde planet reflects.
                        </p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li>If your <strong>Mercury</strong> is retrograde, you might not be the loudest person in the room, but your internal dialogue is incredibly complex.</li>
                            <li>If your <strong>Mars</strong> is retrograde, you might hesitate to act externally but possess an immense amount of internal "simmering" energy.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>3. The Karmic Meaning: "Unfinished Business"</h4>
                        <p className='mb-2'>
                            In the karmic context, a retrograde planet often points to <strong>Sanchita Karma</strong> (accumulated actions from the past).
                        </p>
                        <p className='mb-2'>
                            It suggests that in a previous life, you either overused or neglected the qualities of that planet. In this life, the planet "goes back" to make sure you get it right this time. It represents a "Repeat Exam."
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>4. How Specific Retrograde Planets Behave</h4>
                        <div className='overflow-x-auto mb-4'>
                            <table className='min-w-full divide-y divide-gray-200 text-xs'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Planet</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Retrograde Behavior</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    <tr><td className='px-2 py-1 font-bold'>Mars (Vakra)</td><td className='px-2 py-1'>Energy is directed inward; can lead to deep-seated bravery or suppressed anger.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Mercury (Vakra)</td><td className='px-2 py-1'>Unique way of thinking; "outside the box" logic; potential for profound writing/research.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Jupiter (Vakra)</td><td className='px-2 py-1'>Searching for truth outside traditional religion; unique moral compass; internal wisdom.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Venus (Vakra)</td><td className='px-2 py-1'>Re-evaluating relationships; unconventional tastes in art or beauty; deep soul-searching in love.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Saturn (Vakra)</td><td className='px-2 py-1'>A heavy sense of duty; feeling like you are constantly "doing it over"; great potential for mastery through struggle.</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p className='text-xs italic mb-2'>Note: The Sun and Moon are never retrograde. Rahu and Ketu are almost always retrograde.</p>

                        <h4 className='font-bold mt-3 mb-1'>5. The "Backwards" Rule for House Results</h4>
                        <p className='mb-2'>
                            Some scholars argue that a retrograde planet reaches back to the house behind it. For example, if you have Retrograde Jupiter in the 5th house, it will give results of both the 5th and the 4th house. It acts as a bridge between two areas of your life.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>6. What happens during a Retrograde Dasha?</h4>
                        <p className='mb-2'>
                            During the Mahadasha of a retrograde planet, expect a period of significant internal growth. Things rarely move in a straight line. You might take one step forward and two steps back, but those two steps back allow you to fix mistakes that would have caused a collapse later on.
                        </p>

                        <p className='italic mt-2'>
                            <strong>Summary:</strong> Don't fear a retrograde planet! It isn't "weak" or "bad"—it’s just deliberate. It refuses to be rushed.
                        </p>
                    </Block>
                </Page>
            </Popup>
            <Popup
                opened={showDarakarakaModal}
                onBackdropClick={() => setShowDarakarakaModal(false)}
            >
                <Page>
                    <Navbar
                        title="Darakaraka Explained"
                        right={<></>}
                    >
                        <button onClick={() => setShowDarakarakaModal(false)} className="w-4 cursor-pointer"><CircleX /></button>
                    </Navbar>
                    <Block className="text-sm text-gray-700">
                        <p className='mb-2'>
                            If the <strong>Atmakaraka</strong> is the "King" of your chart representing You, then the <strong>Darakaraka (DK)</strong> is the "Queen," representing your <strong>Spouse</strong> or long-term life partner.
                        </p>
                        <p className='mb-2 italic'>
                            In the Jaimini system, the Darakaraka is the planet that holds the lowest degree in your birth chart (excluding Rahu and Ketu in most traditions).
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>The Partner Significator</h4>
                        <p className='mb-2'>
                            The word <em>Dara</em> means "wife" or "spouse." While Venus (for men) and Jupiter (for women) are the general indicators of marriage, the Darakaraka is your personal indicator. It describes the physical appearance, nature, and professional background of the person you are destined to partner with.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>What the Darakaraka Planet Reveals:</h4>
                        <div className='overflow-x-auto mb-4'>
                            <table className='min-w-full divide-y divide-gray-200 text-xs'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Darakaraka Planet</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Potential Qualities of the Spouse</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    <tr><td className='px-2 py-1 font-bold'>Sun</td><td className='px-2 py-1'>Authoritative, stable, high status, perhaps a bit egoistic or from a political/noble family.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Moon</td><td className='px-2 py-1'>Nurturing, emotional, changeable moods, very domestic, or involved in hospitality/care.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Mars</td><td className='px-2 py-1'>Athletic, courageous, maybe argumentative, likely in a technical, military, or medical field.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Mercury</td><td className='px-2 py-1'>Intellectual, youthful, witty, good at communication, likely in business or teaching.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Jupiter</td><td className='px-2 py-1'>Wise, religious, perhaps older or very traditional, likely a counselor, lawyer, or teacher.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Venus</td><td className='px-2 py-1'>Artistic, beautiful, refined taste, loves luxury, likely in the arts, fashion, or entertainment.</td></tr>
                                    <tr><td className='px-2 py-1 font-bold'>Saturn</td><td className='px-2 py-1'>Mature, hardworking, serious, perhaps from a humble background or older/very disciplined.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4 className='font-bold mt-3 mb-1'>How to Read the Darakaraka</h4>
                        <p className='mb-2'>To get the full picture of your "marriage karma," look at three things:</p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>The Planet itself:</strong> As shown in the table above, this gives the "vibe" of the partner.</li>
                            <li><strong>The House it occupies:</strong> If your DK is in the 10th house, you might meet your spouse through work. If it's in the 9th, you might meet them while traveling or at a place of learning.</li>
                            <li><strong>The Relationship with Atmakaraka:</strong> This is the "secret sauce." If your AK (You) and DK (Spouse) are in a friendly relationship (e.g., sitting together or in friendly signs), the marriage is usually very harmonious.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>Why "Lowest Degree"?</h4>
                        <p className='mb-2'>
                            In Jaimini astrology, the planet with the highest degree (AK) leads, while the planet with the lowest degree (DK) is seen as the "follower" or the one who supports the King/Soul. It represents the person who completes you.
                        </p>

                        <p className='italic mt-2'>
                            <strong>Pro-Tip:</strong> Check the D9 (Navamsha) chart for your Darakaraka. The sign it sits in there often reveals the true inner nature of your spouse, which might only become apparent after the "honeymoon phase" is over.
                        </p>
                    </Block>
                </Page>
            </Popup>
            <Popup
                opened={showAtmakarakaModal}
                onBackdropClick={() => setShowAtmakarakaModal(false)}
            >
                <Page>
                    <Navbar
                        title="Atmakaraka Explained"
                        right={<></>
                        }
                    >
                        <button onClick={() => setShowAtmakarakaModal(false)} className="w-4 cursor-pointer"><CircleX /></button>

                    </Navbar>
                    <Block className="text-sm text-gray-700">
                        <p className='mb-2'>
                            If the <strong>Yogakaraka</strong> is the CEO of your career and material success, the <strong>Atmakaraka (AK)</strong> is the King/Queen of your soul.
                        </p>
                        <p className='mb-2 italic'>
                            In the Jaimini system of Vedic astrology, the Atmakaraka is the planet that holds the highest degree in your birth chart (ignoring the signs, just looking at the numerical value from 0° to 30°).
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>The "Soul Significator"</h4>
                        <p className='mb-2'>
                            The word <em>Atma</em> means Soul and <em>Karaka</em> means Significator. This planet represents your deepest desires, the struggles your soul has chosen to face, and the ultimate purpose of your current incarnation.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>The Two Types of Atmakaraka:</h4>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Chara Atmakaraka:</strong> The "Moving" significator. This is the planet with the highest degree in your specific chart. It changes from person to person.</li>
                            <li><strong>Sthira Atmakaraka:</strong> The "Fixed" significator. In general astrology, the Sun is always the natural significator of the soul.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>What your Atmakaraka Planet says about you</h4>
                        <p className='mb-2'>
                            The planet that becomes your AK reveals the "curriculum" your soul is here to learn:
                        </p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Sun as AK:</strong> You are learning about ego, humility, and true leadership. The lesson is to shine without burning others.</li>
                            <li><strong>Moon as AK:</strong> You are learning about compassion, emotional stability, and motherhood/nurturing. The lesson is to find peace within.</li>
                            <li><strong>Mars as AK:</strong> You are learning to control anger and practice non-violence. The lesson is to use strength for protection, not destruction.</li>
                            <li><strong>Mercury as AK:</strong> You are learning about truthful communication and intellectual honesty. The lesson is to master the mind.</li>
                            <li><strong>Jupiter as AK:</strong> You are learning to respect teachers, children, and traditional wisdom. The lesson is to remain a student of life.</li>
                            <li><strong>Venus as AK:</strong> You are learning about clean relationships and controlling sensory desires. The lesson is pure, selfless love.</li>
                            <li><strong>Saturn as AK:</strong> You are learning about grief, discipline, and the suffering of others. This is a "heavy" AK, indicating a soul here to pay off significant karmic debts through service.</li>
                            <li><strong>Rahu as AK:</strong> (Used in some traditions) You are learning about being cheated or cheating, and eventually moving toward spiritual transparency.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>The Karakamsa: The Soul's True Map</h4>
                        <p className='mb-2'>
                            To see the "pure" state of your soul, astrologers look at the <strong>Karakamsa</strong>. This is the sign in which your Atmakaraka planet is placed in the <strong>Navamsha (D9) chart</strong>.
                        </p>
                        <p className='mb-2'>
                            If your AK is Mars, and in your D9 chart Mars is in Leo, then Leo is your Karakamsa. This reveals the hidden talents and the spiritual direction your soul is gravitating toward, regardless of what you do for a living.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>Why is it important?</h4>
                        <p className='mb-2'>
                            During the Mahadasha of your Atmakaraka planet, life often feels very intense. You might experience great heights or significant falls, but the goal is always spiritual evolution. It is said that the AK planet is like a "strict parent"—it may give you challenges, but only to ensure you fulfill your destiny.
                        </p>
                        <p className='italic mt-2'>
                            <strong>A quick tip:</strong> Always look at the house where your AK sits. That area of life will be the primary "classroom" for your soul's growth.
                        </p>
                    </Block>
                </Page>
            </Popup>
            <Popup
                opened={showConjunctionsModal}
                onBackdropClick={() => setShowConjunctionsModal(false)}
            >
                <Page>
                    <Navbar
                        title="Conjunctions Explained"
                        right={<></>
                        }
                    >
                        <button onClick={() => setShowConjunctionsModal(false)} className="w-4 cursor-pointer"><CircleX /></button>

                    </Navbar>
                    <Block className="text-sm text-gray-700">
                        <p className='mb-2'>
                            In Vedic astrology, a <strong>Conjunction</strong> (known as <strong>Yuti</strong>) occurs when two or more planets sit in the same house in your birth chart.
                        </p>
                        <p className='mb-2 italic'>
                            If the Mahadasha is the "time," then the Conjunction is the "chemistry." When planets huddle together, they blend their energies, sometimes creating a powerhouse effect (Yoga) and other times creating friction and "noise" (Dosha).
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>1. The Proximity Rule (Degrees)</h4>
                        <p className='mb-2'>
                            Not all conjunctions are created equal. The closer the planets are by degree, the more intense the blend:
                        </p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Loose Conjunction (15°–30° apart):</strong> They are in the same room but minding their own business.</li>
                            <li><strong>Close Conjunction (5°–15° apart):</strong> They are actively collaborating or arguing.</li>
                            <li><strong>Exact/Deep Conjunction (0°–5° apart):</strong> Their identities are fused. You cannot experience one without the other.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>2. Famous "Power" Conjunctions (Yogas)</h4>
                        <p className='mb-2'>
                            When "friendly" planets or specific house lords meet, they create Raja Yogas (Kingship/Success combinations):
                        </p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Dharma-Karma Adhipati Yoga:</strong> The lord of a Trikona (1, 5, 9) and a Kendra (1, 4, 7, 10) sitting together. This is the "Gold Standard" for career success.</li>
                            <li><strong>Laxmi Yoga:</strong> Usually involving Venus and the 9th Lord, bringing grace and wealth.</li>
                            <li><strong>Budh-Aditya Yoga:</strong> Sun and Mercury. Extremely common, but when close together, it creates high intelligence and a "brilliant" reputation.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>3. Challenging Conjunctions (Doshas)</h4>
                        <p className='mb-2'>
                            Sometimes the chemistry is volatile, like mixing oil and water:
                        </p>
                        <ul className='list-disc pl-5 mb-2'>
                            <li><strong>Shani-Mangal (Saturn & Mars):</strong> Like driving with one foot on the gas and one on the brake. It creates immense inner tension and technical skill but can lead to "explosive" frustration.</li>
                            <li><strong>Guru-Chandal (Jupiter & Rahu):</strong> Jupiter is the priest; Rahu is the rebel. This can lead to unconventional wisdom or, conversely, a questioning of traditional values and ethics.</li>
                            <li><strong>Grahan (Eclipse) Yoga:</strong> Sun or Moon sitting with Rahu or Ketu. This "shadows" the luminaries, often causing issues with self-confidence or emotional stability.</li>
                        </ul>

                        <h4 className='font-bold mt-3 mb-1'>4. The "Combust" Factor (Astangata)</h4>
                        <p className='mb-2'>
                            If a planet gets too close to the Sun (usually within 6° to 10°), it becomes <strong>Combust</strong>. Think of it like standing too close to a massive spotlight; you’re still there, but no one can see you because the light is blinding.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>5. Planetary War (Graha Yuddha)</h4>
                        <p className='mb-2'>
                            When two planets (excluding the Sun, Moon, Rahu, and Ketu) are within 1 degree of each other, they are "at war." Usually, the planet with the lower degree is considered the winner.
                        </p>

                        <h4 className='font-bold mt-3 mb-1'>Summary: How to Read a Conjunction</h4>
                        <div className='overflow-x-auto mb-4'>
                            <table className='min-w-full divide-y divide-gray-200 text-xs'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Step</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>What to look for</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Why it matters</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    <tr><td className='px-2 py-1'>1</td><td className='px-2 py-1'>The Degrees</td><td className='px-2 py-1'>Tells you the intensity of the "fusion."</td></tr>
                                    <tr><td className='px-2 py-1'>2</td><td className='px-2 py-1'>Friendship</td><td className='px-2 py-1'>Are the planets natural friends or enemies?</td></tr>
                                    <tr><td className='px-2 py-1'>3</td><td className='px-2 py-1'>House Ownership</td><td className='px-2 py-1'>Which houses do they rule? They will bring the "vibes" of those houses.</td></tr>
                                    <tr><td className='px-2 py-1'>4</td><td className='px-2 py-1'>The Sign</td><td className='px-2 py-1'>Is the meeting happening in a sign where one planet is "Exalted" or "Debilitated"?</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Block>
                </Page>
            </Popup>
            <Popup
                opened={showYogakarakaModal}
                onBackdropClick={() => setShowYogakarakaModal(false)}
            >
                <Page>
                    <Navbar
                        title="Yogakaraka Explained"
                        right={<></>
                        }
                    >
                        <button onClick={() => setShowYogakarakaModal(false)} className="w-4 cursor-pointer"><CircleX /></button>

                    </Navbar>
                    <Block className="text-sm text-gray-700">
                        <p className='mb-2'>
                            In Vedic astrology, a planet only earns the title of "Yogakaraka" (the maker of great combinations) if it simultaneously rules a Kendra (an angular house: 1, 4, 7, 10) and a Trikona (a trinal house: 1, 5, 9).
                        </p>
                        <p className='mb-2'>
                            Because of the way the zodiac signs are mathematically laid out, only certain Ascendants (Lagnas) have a single planet that can "bridge" these two power centers.
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>The "Lucky" Ascendants</h4>
                        <p className='mb-2'>
                            Only about half of the 12 zodiac signs have a natural Yogakaraka. If you are one of these, that specific planet becomes your "Super Planet"—the one that can single-handedly bring success, status, and wealth.
                        </p>
                        <div className='overflow-x-auto mb-4'>
                            <table className='min-w-full divide-y divide-gray-200 text-xs'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Ascendant (Lagna)</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Yogakaraka Planet</th>
                                        <th className='px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider'>Houses Ruled</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Taurus</td><td className='px-2 py-1 whitespace-nowrap'>Saturn</td><td className='px-2 py-1 whitespace-nowrap'>9th (Fortune) & 10th (Career)</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Cancer</td><td className='px-2 py-1 whitespace-nowrap'>Mars</td><td className='px-2 py-1 whitespace-nowrap'>5th (Intellect) & 10th (Career)</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Leo</td><td className='px-2 py-1 whitespace-nowrap'>Mars</td><td className='px-2 py-1 whitespace-nowrap'>4th (Happiness) & 9th (Fortune)</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Libra</td><td className='px-2 py-1 whitespace-nowrap'>Saturn</td><td className='px-2 py-1 whitespace-nowrap'>4th (Home) & 5th (Creativity)</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Capricorn</td><td className='px-2 py-1 whitespace-nowrap'>Venus</td><td className='px-2 py-1 whitespace-nowrap'>5th (Merit) & 10th (Karma/Career)</td></tr>
                                    <tr><td className='px-2 py-1 whitespace-nowrap'>Aquarius</td><td className='px-2 py-1 whitespace-nowrap'>Venus</td><td className='px-2 py-1 whitespace-nowrap'>4th (Comfort) & 9th (Dharma/Fortune)</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <h4 className='font-bold mt-3 mb-1'>Why doesn't everyone have one?</h4>
                        <p className='mb-2'>
                            For the other signs (Aries, Gemini, Virgo, Scorpio, Sagittarius, and Pisces), no single planet rules both a Kendra and a Trikona.
                            <br />
                            For example, in Aries: The 9th house (Trikona) is ruled by Jupiter, and the 10th house (Kendra) is ruled by Saturn. Since it’s two different planets, neither can claim the "Yogakaraka" title alone. They have to work together (in conjunction or aspect) to create a Raja Yoga.
                        </p>
                        <p className='mb-2'>
                            Neutrality: In these signs, planets often rule one "good" house and one "difficult" house (like the 6th, 8th, or 12th), which "dilutes" their power to be a pure Yogakaraka.
                        </p>
                        <h4 className='font-bold mt-3 mb-1'>Does this mean the other signs are "unlucky"?</h4>
                        <p className='mb-2'>
                            Not at all! It just means your path to success usually requires a partnership between two planets rather than one "MVP" doing all the heavy lifting.
                            <br />
                            Think of it like this: A Yogakaraka is like a multi-talented CEO who can handle both strategy and operations. For the other signs, you just need a great Strategist and a great Operator working in sync.
                        </p>
                    </Block>
                </Page>
            </Popup>
        </Card >
    );
};