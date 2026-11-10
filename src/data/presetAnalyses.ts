import { PhotoAnalysisResult } from '../types/analysis';
import { enforceDescriptionLimit, countWords } from '../utils/promptFormatter';

export interface PresetSampleItem {
  id: string;
  labelRu: string;
  categoryRu: string;
  imageUrl: string;
  aspectRatio: string;
  resolutionBadge: string;
  analysis: PhotoAnalysisResult;
}

const watchmakerDescription = enforceDescriptionLimit(
  `SUBJECT, POSE & MICRO-ANATOMY: An elderly master horologist with warm medium-deep bronze skin and a closely cropped crown of silver-white hair mixed with salt-and-pepper beard stubble is captured in a three-quarter right-facing profile at a traditional wooden watchmaking bench. A vintage burnished-brass monocular jeweler's loupe is held firmly in his right orbital socket by the natural contraction of his brow and cheek muscles. His head tilts slightly downward at a 22-degree angle toward his raised hands. Both weathered hands are positioned at chest height in the right-center foreground: his left hand cradles a large, exposed vintage brass pocket-watch chronograph movement lacking its dial and case back, revealing interlocking gilded gear trains, steel bridges, ruby jewel bearings, and a coiled hairspring; his right hand pinches a cylindrical polished steel jewel container with two small white synthetic sapphire disks resting inside. Every anatomical detail is rendered with forensic clarity: deep horizontal forehead creases, crow's-feet radiating from the outer eye corner, prominent dorsal veins and tendons across the back of his right hand, fine transverse skin wrinkles over the knuckles, and a brushed stainless-steel mechanical wristwatch with a black dial strapped to his right wrist.

CLOTHING & MATERIAL FABRICS: He wears a washed charcoal-slate cotton button-down work shirt with visible twill weave, soft collar folds, and natural creasing along the forearm and shoulder seams. Over the shirt sits a worn black full-grain leather horologist's bib apron suspended by a distressed dark-brown leather neck strap showing frayed edge fibers, subtle oil patina, and metallic rivets at the chest corner.

SPATIAL COMPOSITION & CAMERA GEOMETRY: Captured at eye level from a close medium-shot distance (approximately 0.85 meters) using a 50mm standard prime lens at f/2.8 on a full-frame sensor. The subject occupies the left and central thirds of the horizontal 4:3 frame, while the complex brass timepiece mechanism sits at the upper-right intersection of the rule-of-thirds grid, establishing a tight diagonal sightline from the brass ocular loupe directly to the exposed gear train. Depth of field is critically sharp across the watchmaker's face, beard hairs, brass loupe, hands, and chronograph caliber, transitioning into a progressive, creamy optical bokeh across the workbench tools in the lower-right background.

PHOTOMETRIC LIGHTING & COLOR SCIENCE: Illuminated by a high-contrast chiaroscuro studio setup. The primary key light is a gridded rectangular softbox visible at the upper-left edge of the frame, casting crisp directional illumination across the watchmaker's forehead, cheekbone, brass loupe, and the textured dorsal surface of his hands. A subtle warm fill reflects upward from the oiled walnut workbench surface, creating a 5:1 key-to-fill lighting ratio. Specular micro-highlights glint off the beveled brass edges of the loupe, the polished steel chronograph levers, and individual silver beard hairs. The background is a matte, mottled dark-charcoal studio canvas that absorbs stray spill light. Color grading balances cool neutral slate grays (#2A2E33) and deep obsidian shadows (#0F1215) against rich burnished gold-brass (#C89D54) and warm mahogany-bronze skin tones (#8C583A).

ENVIRONMENT & WORKBENCH PROPS: In the softly defocused lower-right foreground and midground, the scarred walnut workbench features a curved ergonomic cutout. Arrayed neatly on the timber surface are two precision stainless-steel micro-screwdrivers with knurled shafts and red-anodized collars, a rectangular brushed-aluminum parts tray holding tiny steel screws and pinions, folded brown suede tool rolls, an amber glass oiler bottle, and a vertical rack of watchmaking stakes.`
);

const architectureDescription = enforceDescriptionLimit(
  `ARCHITECTURAL STRUCTURE & GEOMETRY: A monumental brutalist concrete pavilion cantilevers dramatically outward from a rugged basalt cliffside above a tranquil Nordic fjord during deep blue hour. The building comprises two intersecting monolithic board-formed concrete volumes supported underneath by a massive V-shaped reinforced concrete pier anchored directly into the fractured bedrock. The primary right-hand wing projects horizontally over the water, terminating in an angled, chamfered soffit and a floor-to-ceiling structural glass curtain wall spanning three vertical mullions. The raw exterior concrete exhibits authentic vertical formwork timber imprints, weathered rainwater streaks, dark mineral staining along the upper parapet, and subtle recessed tie-rod holes.

INTERIOR ILLUMINATION & HUMAN SCALE: Through the expansive corner glazing of the cantilevered lounge, the interior glows with warm 2700K tungsten architectural lighting that contrasts starkly against the cold sub-arctic twilight. Inside the double-height board-formed concrete room, two dark-silhouetted figures sit relaxed on a low-profile charcoal-gray modernist sofa facing a minimal coffee table, accompanied by a sculpted lounge armchair and three warm floor lamps casting soft amber pools across the internal concrete walls and ceiling soffit.

FOREGROUND TERRAIN & HYDROLOGICAL TEXTURES: The lower third of the 16:9 widescreen frame is dominated by a jagged, wet volcanic basalt shoreline descending from left to right. The dark rock slabs are fractured by geometric fissures, patches of pale green-gray arctic lichen, low coastal heather shrubs, and small evergreen saplings clinging to crevices. In the lower-right foreground, a shallow rainwater puddle trapped in a depression of the dark craggy rock mirrors the golden amber glow of the pavilion's window with wet specular precision.

BACKGROUND LANDSCAPE & ATMOSPHERIC OPTICS: Beyond the cantilevered concrete structure, the glassy, slate-blue waters of the fjord stretch toward steep, glaciated mountain walls rising on both flanks. A low, ethereal bank of pale cyan-gray mist hovers just above the water surface at the base of the distant fjords, partially veiling the sheer granite cliffs and dark pine forests on the left slope. The calmer water on the right acts as a dark satin mirror, reflecting the silhouette of the eastern mountain ridge and the diffused cobalt sky.

CAMERA PERSPECTIVE & COLOR SCIENCE: Captured on a medium-format digital system using a 24mm rectilinear tilt-shift lens at f/8 for extensive hyperfocal depth of field from the foreground lichen-covered rocks to the distant misty peaks. The camera is positioned at a slightly low three-quarter vantage point on the rocky outcrop, aligning the sharp corner of the cantilevered glass box near the dead center of the composition. Dynamic range spans over 14 stops, retaining crisp shadow detail in the wet coal-black basalt (#12161F) while preventing highlight clipping in the glowing tungsten interior (#F4A23E) against the moody Prussian-blue twilight sky (#3B5675).`
);

const macroBotanicalDescription = enforceDescriptionLimit(
  `BOTANICAL SUBJECT & MICRO-TOPOGRAPHY: An extreme macro photograph captures the undulating, velvety upper petal and central column of a rare dark-burgundy Phalaenopsis orchid bathed in low-angle golden sunrise backlighting. The primary left-center petal sweeps gracefully across the frame in a convex arc, its epidermal surface composed of thousands of microscopic conical papillae that lend the tissue a lush, crushed-velvet sheen. The petal's coloration transitions from deep wine-claret and mulberry (#5B122A) in the shaded lower folds to luminous ruby-magenta (#9E2A4B) along the sunlit upper ridge. To the lower right, the sculptural bilobed lip and pale cream-pink column (gynostemium) with subtle leopard-like maroon spotting emerge from the floral throat.

CRYSTALLINE DEWDROP OPTICS & REFRACTION: Blanketing the hydrophobic burgundy epidermis are dozens of pristine, spherical and hemispherical morning dewdrops ranging from sub-millimeter micro-beads along the petal perimeter to a dominant 3-millimeter central droplet resting near the middle of the main petal. Because the scene is directly backlit by the rising sun, each water sphere acts as a tiny convex optical lens: light refracts through the transparent liquid bodies to form razor-sharp internal caustics, bright golden-white specular crescent rims, and miniature inverted reflections of the sunlit background inside the larger droplets. Minute air micro-bubbles and surface tension contact angles where water meets the velvety floral cells are resolved with laboratory-grade acutance.

COMPOSITION & ULTRA-SHALLOW DEPTH OF FIELD: Framed in a 4:3 horizontal aspect ratio using a 100mm f/2.8 1:1 true macro prime lens stopped down to f/5.6 at minimum focusing distance. The plane of critical focus slices precisely across the crest of the primary left-hand burgundy petal and its constellation of central dewdrops. Objects just millimeters in front of or behind this focal ribbon—including the lower-left secondary petal and the upper-right dorsal sepal—dissolve smoothly into a velvety, aberration-free optical blur.

PHOTOMETRIC BACKLIGHTING & ATMOSPHERIC FLARE: Positioned directly at the top-center edge of the frame, the blinding solar disk of early morning sun bursts into the lens, radiating delicate, warm golden-amber diffraction rays (crepuscular starburst) downward across the upper petal rim. This intense rim-lighting creates a translucent glowing halo along the microscopic edge hairs and water beads lining the petal's upper contour. The distant background is rendered as a rich mosaic of large, overlapping circular bokeh orbs in warm honey-gold (#E8A848), burnt orange (#A85216), and deep forest olive-brown (#1D2214).`
);

export const PRESET_SAMPLES: PresetSampleItem[] = [
  {
    id: 'preset-watchmaker',
    labelRu: 'Часовщик в студии (Портрет · Свет)',
    categoryRu: 'Студийный портрет · 50mm f/2.8',
    imageUrl: '/samples/sample_portrait_studio.jpg',
    aspectRatio: '4:3',
    resolutionBadge: '8K RAW SPEC',
    analysis: {
      id: 'preset-watchmaker',
      title: 'Master Horologist Inspecting Chronograph Caliber',
      timestamp: '2026-11-09T21:08:39.000Z',
      imagePreviewUrl: '/samples/sample_portrait_studio.jpg',
      detailedDescriptionEn: watchmakerDescription,
      characterCount: watchmakerDescription.length,
      wordCount: countWords(watchmakerDescription),
      sections: [
        {
          id: 'sec-1',
          titleRu: 'Объект, поза и микрофактура',
          titleEn: 'Subject, Pose & Micro-Anatomy',
          contentEn:
            'Elderly master horologist with medium-deep bronze skin, cropped silver-white hair, and salt-and-pepper beard in three-quarter right profile. A burnished-brass monocular loupe is wedged in his right eye socket while his veined, weathered hands hold an exposed brass chronograph movement in the left hand and a cylindrical steel jewel capsule in the right hand. A brushed steel wristwatch sits on his right wrist.',
        },
        {
          id: 'sec-2',
          titleRu: 'Одежда и материалы',
          titleEn: 'Apparel & Materiality',
          contentEn:
            'Washed charcoal-slate cotton button-down work shirt with visible twill weave beneath a distressed black full-grain leather watchmaker apron held by a worn brown leather neck strap with brass rivets.',
        },
        {
          id: 'sec-3',
          titleRu: 'Композиция и оптика камеры',
          titleEn: 'Spatial Composition & Camera Geometry',
          contentEn:
            'Eye-level medium close-up captured on a 50mm prime lens at f/2.8 in 4:3 format. Critical focus locks onto facial pores, silver stubble, the brass loupe, and the intricate gear train, while the walnut workbench tools in the lower-right recede into smooth bokeh.',
        },
        {
          id: 'sec-4',
          titleRu: 'Светотень, палитра и окружение',
          titleEn: 'Photometric Lighting & Workbench Props',
          contentEn:
            '5:1 chiaroscuro studio lighting from a gridded rectangular softbox visible at upper-left, casting crisp specular highlights across skin creases, brass gears, and steel tools against a matte charcoal canvas backdrop.',
        },
      ],
      promptVariantA: {
        labelRu: 'Промт №1 — Художественно-оптический нарратив (Grok / ChatGPT / Claude / Gemini)',
        subtitleRu: 'Связная академическая спецификация сцены, анатомии и студийного света',
        styleTagEn: 'Continuous Optical & Narrative Prose',
        baseTextEn:
          'A high-contrast editorial studio photograph in 4:3 horizontal format depicting an older master watchmaker with warm bronze skin, closely cropped silver-white hair, and textured gray-and-white beard stubble in three-quarter right-facing profile. A vintage burnished-brass monocular loupe is gripped in his right eye socket as he gazes downward at his raised, weathered hands. His left hand holds a large, open brass pocket-watch chronograph movement revealing intricate golden gears, steel bridges, and ruby bearings, while his right hand pinches a small polished steel jewel cylinder containing two white sapphire disks. He wears a charcoal-gray cotton button-down shirt under a worn black leather bib apron with a distressed brown leather neck strap, and a stainless-steel black-dial wristwatch on his right wrist. In the upper-left corner, the edge of a gridded studio softbox illuminates his creased forehead, dorsal hand veins, and the metallic gears against a dark mottled charcoal backdrop. Below on the right, a walnut workbench holds precision steel micro-screwdrivers, an aluminum parts tray, a glass oiler bottle, and leather pads in soft optical bokeh.',
      },
      promptVariantB: {
        labelRu: 'Промт №2 — Техническая фотометрическая матрица (Grok Raw / Flux / Midjourney / SDXL)',
        subtitleRu: 'Альтернативный словарь и синтаксис: плотные дескрипторы оптики, поверхностей и геометрии',
        styleTagEn: 'Photometric & Cinematographic Token Matrix',
        baseTextEn:
          'Medium close-up documentary portrait, senior horologist artisan angled 45 degrees toward right frame, deep-toned weathered complexion with hyper-resolved epidermal pores, furrowed brow, and coarse silver facial bristles. Right ocular socket fitted with antique tarnished-brass magnifier lens directed at elevated palms. Left fingers supporting uncased gilded mechanical timepiece caliber with exposed escapement wheels and jewel pivots; right thumb and index holding cylindrical chrome vial with twin translucent stones; brushed steel dive watch on right forearm. Attire: slate-charcoal woven work shirt layered beneath patinated black hide craftsman apron with rawhide neck loop. Environment: scarred timber horology desk at lower right populated with red-collared jeweler screwdrivers, rectangular metal component dish, amber lubricant flask, and tool rack. Lighting: visible gridded rectangular diffuser box at top-left edge, 5:1 directional chiaroscuro key light, warm wood bounce fill, deep matte anthracite background.',
      },
      opticalTelemetry: {
        estimatedFocalLength: '50mm f/1.4 Summilux Prime',
        apertureProfile: 'f/2.8 — Tack-Sharp Subject Plane',
        lightingRatio: '5:1 Gridded Softbox Chiaroscuro',
        colorTemperatureKelvin: '5100K Neutral Studio Daylight',
        dynamicRangeStops: '14.4 EV Stops',
        dominantPaletteHex: ['#14181D', '#373D45', '#8C583A', '#C89D54', '#D9DDE2'],
      },
    },
  },
  {
    id: 'preset-architecture',
    labelRu: 'Павильон над фьордом (Архитектура)',
    categoryRu: 'Архитектура · Режимное время · 24mm',
    imageUrl: '/samples/sample_architecture_dusk.jpg',
    aspectRatio: '16:9',
    resolutionBadge: '8K RAW SPEC',
    analysis: {
      id: 'preset-architecture',
      title: 'Brutalist Cantilevered Pavilion Over Nordic Fjord at Blue Hour',
      timestamp: '2026-11-09T21:08:39.000Z',
      imagePreviewUrl: '/samples/sample_architecture_dusk.jpg',
      detailedDescriptionEn: architectureDescription,
      characterCount: architectureDescription.length,
      wordCount: countWords(architectureDescription),
      sections: [
        {
          id: 'sec-1',
          titleRu: 'Архитектурный объём и бетон',
          titleEn: 'Architectural Volume & Concrete Materiality',
          contentEn:
            'Monumental brutalist pavilion composed of intersecting board-formed concrete volumes cantilevered over a fjord on a V-shaped concrete pier, showing vertical timber shuttering marks, dark rain streaks, and a chamfered floor-to-ceiling glass corner.',
        },
        {
          id: 'sec-2',
          titleRu: 'Интерьер и масштаб человека',
          titleEn: 'Interior Tungsten Glow & Human Scale',
          contentEn:
            'Through three tall glass bays, the warm 2700K tungsten-lit concrete lounge reveals two silhouetted occupants seated on a modern sofa, a lounge chair, and three glowing floor lamps.',
        },
        {
          id: 'sec-3',
          titleRu: 'Передний план и скальная порода',
          titleEn: 'Foreground Basalt & Water Reflections',
          contentEn:
            'Wet volcanic basalt boulders fractured with fissures, pale arctic lichen, low coastal shrubs, and a small rainwater puddle in the lower-right rock face reflecting the golden interior light.',
        },
        {
          id: 'sec-4',
          titleRu: 'Атмосфера фьорда и оптика',
          titleEn: 'Fjord Mist, Twilight Sky & Camera Optics',
          contentEn:
            'Captured on a 24mm tilt-shift medium-format lens at f/8 during blue hour. Glassy fjord waters, low cyan-gray mist banks hugging steep mountain cliffs, and a 14-stop dynamic balance between warm amber and cold Prussian blue.',
        },
      ],
      promptVariantA: {
        labelRu: 'Промт №1 — Художественно-оптический нарратив (Grok / ChatGPT / Claude / Gemini)',
        subtitleRu: 'Связная академическая спецификация архитектуры, ландшафта и сумеречного света',
        styleTagEn: 'Continuous Optical & Narrative Prose',
        baseTextEn:
          'A cinematic 16:9 widescreen architectural photograph of a brutalist board-formed concrete pavilion cantilevered dramatically over a misty Nordic fjord at deep blue hour. The monolithic structure rests on an angled V-shaped concrete support pier anchored into dark, wet volcanic basalt cliffs on the left and projects outward toward the center-right, terminating in a faceted floor-to-ceiling glass curtain wall. Vertical timber formwork textures and dark rainwater weathering stains mark the raw concrete facade. Inside the cantilevered glass lounge, warm 2700K golden tungsten floor lamps illuminate board-formed concrete walls where two silhouetted people sit conversing on a modern sofa. The foreground consists of fractured wet black basalt rocks covered in pale green lichen, low alpine shrubs, and a small rock puddle at lower right reflecting the amber window glow. Behind the building, glassy dark-blue fjord water reflects steep mountain ridges wrapped in low floating bands of pale blue mist under an overcast twilight sky.',
      },
      promptVariantB: {
        labelRu: 'Промт №2 — Техническая фотометрическая матрица (Grok Raw / Flux / Midjourney / SDXL)',
        subtitleRu: 'Альтернативный словарь и синтаксис: геометрия, физика света и среднеформатная оптика',
        styleTagEn: 'Photometric & Cinematographic Token Matrix',
        baseTextEn:
          'Wide-angle medium-format architectural vista, cantilevered modernist bunker-residence constructed from weathered cast-in-place concrete with vertical plank imprints and moisture patina, balanced atop a tapered V-strut foundation on a craggy coastal promontory. Central-right structural glazing bay with three slim vertical mullions and beveled concrete overhang, radiating 2700K amber incandescent interior luminance with two seated human silhouettes on a contemporary settee. Lower foreground terrain: slick coal-black igneous bedrock with deep geological cracks, crustose gray-green moss, dwarf evergreens, and a specular rainwater depression mirroring the golden room light at bottom-right. Background topography: mirror-calm sub-arctic sea inlet flanked by towering glacial fjord walls, ribbon of low-altitude stratus fog hovering over the water surface, moody indigo-slate cloud cover. Color science: high-contrast complementary split between warm tungsten (#F4A23E) and frigid twilight cobalt (#2C425E).',
      },
      opticalTelemetry: {
        estimatedFocalLength: '24mm f/3.5 Tilt-Shift Rectilinear',
        apertureProfile: 'f/8.0 — Hyperfocal Edge-to-Edge',
        lightingRatio: 'Complementary 2700K Tungsten vs 7500K Blue Hour',
        colorTemperatureKelvin: '6800K Ambient / 2700K Interior',
        dynamicRangeStops: '14.8 EV Stops (Medium Format CMOS)',
        dominantPaletteHex: ['#0E131A', '#2C425E', '#577394', '#D98A36', '#F7C16D'],
      },
    },
  },
  {
    id: 'preset-macro',
    labelRu: 'Орхидея в росе (Макро · Контровой свет)',
    categoryRu: 'Экстремальное макро · 100mm f/2.8',
    imageUrl: '/samples/sample_macro_botanical.jpg',
    aspectRatio: '4:3',
    resolutionBadge: '8K RAW SPEC',
    analysis: {
      id: 'preset-macro',
      title: 'Backlit Burgundy Orchid Petal with Crystalline Morning Dewdrops',
      timestamp: '2026-11-09T21:08:39.000Z',
      imagePreviewUrl: '/samples/sample_macro_botanical.jpg',
      detailedDescriptionEn: macroBotanicalDescription,
      characterCount: macroBotanicalDescription.length,
      wordCount: countWords(macroBotanicalDescription),
      sections: [
        {
          id: 'sec-1',
          titleRu: 'Ботаническая микрофактура лепестка',
          titleEn: 'Botanical Petal Micro-Topography',
          contentEn:
            'Velvety dark-burgundy Phalaenopsis orchid petal arching across the left-center foreground, resolving microscopic conical epidermal cells in rich wine-claret (#5B122A) and backlit ruby-magenta (#9E2A4B), with the spotted floral lip and pale column at lower right.',
        },
        {
          id: 'sec-2',
          titleRu: 'Рефракция и геометрия капель росы',
          titleEn: 'Dewdrop Refraction & Surface Tension',
          contentEn:
            'Dozens of spherical morning dewdrops blanketing the hydrophobic petal surface, led by a prominent 3mm central sphere showing internal golden caustics, specular rim crescents, and crisp contact angles.',
        },
        {
          id: 'sec-3',
          titleRu: 'Плоскость резкости 100mm Macro',
          titleEn: '1:1 Macro Plane of Focus',
          contentEn:
            'Captured with a 100mm f/2.8 macro lens at f/5.6. Razor-thin focal plane cuts across the central constellation of water droplets and velvet cells, while adjacent petals and background foliage melt into creamy circular bokeh.',
        },
        {
          id: 'sec-4',
          titleRu: 'Контровой солнечный свет и боке',
          titleEn: 'Solar Backlighting & Bokeh Palette',
          contentEn:
            'Direct golden sunrise disk positioned at top-center edge, projecting warm diffraction sunbeams downward across the glowing translucent petal rim against honey-gold and dark olive bokeh orbs.',
        },
      ],
      promptVariantA: {
        labelRu: 'Промт №1 — Художественно-оптический нарратив (Grok / ChatGPT / Claude / Gemini)',
        subtitleRu: 'Связная академическая спецификация микрорельефа, рефракции воды и контрового света',
        styleTagEn: 'Continuous Optical & Narrative Prose',
        baseTextEn:
          'An extreme 1:1 macro commercial photograph in 4:3 format showcasing a velvety dark-burgundy orchid petal covered in dozens of crystal-clear spherical morning dewdrops, backlit by the rising golden sun at the top-center edge of the frame. The main wine-red petal arches across the left and center foreground, its microscopic cellular velvet texture glowing ruby-magenta where warm sunbeams graze its upper ridge. A larger central water droplet sits surrounded by smaller beads of varying sizes, each refracting crisp golden caustics and bright white specular highlights. In the lower-right foreground, the orchid’s pale cream-and-pink column and spotted lip rest in soft focus. Rays of golden sunrise light flare downward from the bright solar orb at the top margin against a dark olive-and-amber bokeh background.',
      },
      promptVariantB: {
        labelRu: 'Промт №2 — Техническая фотометрическая матрица (Grok Raw / Flux / Midjourney / SDXL)',
        subtitleRu: 'Альтернативный словарь и синтаксис: клеточная оптика, каустика жидкости и дифракция',
        styleTagEn: 'Photometric & Cinematographic Token Matrix',
        baseTextEn:
          'Ultra-close botanical photomicrography, deep claret-maroon Phalaenopsis blossom epidermis with resolved papillate velvet micro-cells occupying left-center plane, studded with pristine hydrophobic condensation spheres and a dominant central H2O globule exhibiting internal light refraction and razor-sharp meniscus edges. Secondary floral labellum and pale anther cap visible in softly defocused lower-right quadrant. Illumination: direct top-center solar contre-jour source with radiating golden diffraction starburst rays, intense translucent rim-glow along the upper petal contour, creamy circular honey-gold and deep moss-brown optical bokeh discs in background, 100mm f/2.8 apochromatic macro prime at f/5.6.',
      },
      opticalTelemetry: {
        estimatedFocalLength: '100mm f/2.8L Macro IS USM (1:1)',
        apertureProfile: 'f/5.6 — Sub-Millimeter Focal Ribbon',
        lightingRatio: 'Direct Contre-Jour Solar Backlight',
        colorTemperatureKelvin: '3600K Golden Sunrise Spectrum',
        dynamicRangeStops: '14.1 EV Stops',
        dominantPaletteHex: ['#1A1812', '#5B122A', '#9E2A4B', '#E39B38', '#FFF4C8'],
      },
    },
  },
];
