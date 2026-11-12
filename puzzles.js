/* =====================================================================
   REBUSDAY — puzzle bank
   ---------------------------------------------------------------------
   Every puzzle is { a: answer, h: hint, g: grid, why, alt[] }.

   GRID MINI-LANGUAGE (the "g" field)
   • Rows are separated by "\n".
   • A row of exactly "---" draws a horizontal rule.
   • A row of exactly "."   is an empty spacer (used for top/bottom).
   • Tokens in a row are separated by spaces and drawn with a gap.
   • "+" glues pieces together with no gap:  "H+HAND[blue]+AND"
   • "~" is a literal space inside a piece:  "~~~~[box]"  (empty box)
   • Effects go in brackets after a piece:   "TOWN[red,xl]"
   • "@name" draws a doodle from doodles.js:  "@eye @heart U"
     Doodles take effects too:               "@bell[blue]", "@clock[mirror]"

   EFFECTS
     size     xs sm lg xl
     colour   red blue green yellow orange purple pink gray gold silver brown white
     letters  rev (reverse order)  vert (read down)  vup (read up)
              grow shrink scatter fall rise wave split ring cross
     shape    flip mirror side tilt up dn long tall squash half
     style    strike uline box circle fade blur double outline thin bold ital wide tight

   Adding puzzles: add a new batch at the end (see section 8). Answers
   must be unique (duplicates are skipped). Each batch is scheduled
   after the previous one, so adding puzzles never changes a day that
   has already been played.
   ===================================================================== */
(function () {
  'use strict';

  const pools = { easy: [], medium: [], hard: [] };
  const add = (tier, a, g, h, alt, why) =>
    pools[tier].push({ a, g, h, alt: alt ? alt.split(',').map(s => s.trim()).filter(Boolean) : [], why: why || '' });

  /* ---------------------------------------------------------------
     1. RULE-GENERATED COMPOUNDS  (Warm-up pool)
     line format:  rule | answer | BASE | hint | extra,alts
     --------------------------------------------------------------- */
  const COLORS = ['red', 'blue', 'green', 'gold', 'silver', 'pink', 'gray', 'white', 'purple', 'brown'];
  const RULES = {
    back:   { g: b => `${b}[rev]`,            why: 'written backward' },
    down:   { g: b => `${b}[vert]`,           why: 'reading downward' },
    up:     { g: b => `${b}[vup]`,            why: 'reading upward' },
    big:    { g: b => `${b}[xl]`,             why: 'written big' },
    small:  { g: b => `${b}[xs]`,             why: 'written small' },
    split:  { g: b => `${b}[split]`,          why: 'split in two' },
    broken: { g: b => `${b}[scatter]`,        why: 'broken apart' },
    cross:  { g: b => `${b}[cross]`,          why: 'crossed with itself' },
    round:  { g: b => `${b}[ring]`,           why: 'written in a round' },
    square: { g: b => `${b}[box]`,            why: 'inside a square' },
    half:   { g: b => `${b}[half]`,           why: 'only half there' },
    long:   { g: b => `${b}[long]`,           why: 'stretched long' },
    tall:   { g: b => `${b}[tall]`,           why: 'stretched tall' },
    double: { g: b => `${b} ${b}`,            why: 'twice' },
    triple: { g: b => `${b} ${b} ${b}`,       why: 'three times' },
    high:   { g: b => `${b}\n.\n.\n---`,      why: 'up high' },
    low:    { g: b => `.\n.\n${b}\n---`,      why: 'down low' },
    thin:   { g: b => `${b}[thin]`,           why: 'written thin' },
    wide:   { g: b => `${b}[wide]`,           why: 'spread wide' },
    side:   { g: b => `${b}[side]`,           why: 'on its side' },
    fall:   { g: b => `${b}[fall]`,           why: 'falling' },
    rise:   { g: b => `${b}[rise]`,           why: 'rising' },
  };
  COLORS.forEach(c => { RULES[c] = { g: b => `${b}[${c}]`, why: `in ${c}` }; });

  const SYN = { small: ['little', 'tiny'], little: ['small', 'tiny'], big: ['large', 'huge', 'giant'], gray: ['grey'], tall: ['high'], long: ['stretched'] };

  const GENERATED = `
back|backfire|FIRE|When a plan blows up in your face
back|backpack|PACK|Carried to class
back|backyard|YARD|Behind the house
back|backbone|BONE|Spine (or courage)
back|background|GROUND|What's behind the subject
back|backstage|STAGE|Behind the curtain
back|backlog|LOG|Pile of unfinished work
back|backstroke|STROKE|Swim face-up
back|backtrack|TRACK|Retrace your steps
back|backhand|HAND|Tennis swing
back|backlash|LASH|Strong public reaction
back|backflip|FLIP|Gymnast's trick
back|backpedal|PEDAL|Retreat from what you said
back|backseat|SEAT|Where the kids ride
down|downtown|TOWN|City center
down|download|LOAD|Grab a file
down|downpour|POUR|Heavy rain
down|downhill|HILL|Easier from here on
down|downstairs|STAIRS|The lower floor
down|downfall|FALL|Ruin
down|downsize|SIZE|Trim the company
down|touchdown|TOUCH|Six points
down|sundown|SUN|Dusk
down|meltdown|MELT|Total breakdown
up|upstairs|STAIRS|Where the bedrooms usually are
up|uptown|TOWN|The fancy part of the city
up|upset|SET|Unhappy
up|upstream|STREAM|Against the current
up|update|DATE|A fresh version
up|upload|LOAD|Send a file to the cloud
up|uphill|HILL|A tough climb
up|upbeat|BEAT|Cheerful
up|uprising|RISING|Rebellion
up|upright|RIGHT|Vertical (or a kind of piano)
up|grown-up|GROWN|An adult|grownup
up|pickup|PICK|A kind of truck|pick up
big|big deal|DEAL|Something important (or not)
big|big shot|SHOT|Important person
big|bigfoot|FOOT|Legendary forest creature
big|big top|TOP|Circus tent
big|big brother|BROTHER|Always watching
big|bigmouth|MOUTH|Can't keep a secret
big|big bang|BANG|How the universe began
big|big wheel|WHEEL|Fairground ride
small|small talk|TALK|Chit-chat
small|fine print|PRINT|Read it before you sign|small print
small|small world|WORLD|"What a coincidence!"
small|small fry|FRY|Unimportant folks
small|small town|TOWN|Everybody knows everybody
small|little bit|BIT|Just a smidge|a little bit,tiny bit
small|small change|CHANGE|Coins in your pocket
small|small potatoes|POTATOES|Nothing important
split|banana split|BANANA|Ice-cream boat
split|split second|SECOND|An instant
split|split decision|DECISION|The judges disagree
split|split ends|ENDS|Bad hair day problem
broken|broken heart|HEART|After a breakup|heartbreak
broken|broken record|RECORD|Repeating yourself
broken|broken promise|PROMISE|Didn't keep your word
broken|broken english|ENGLISH|Poorly spoken language
broken|breakfast|FAST|Most important meal of the day|break fast
broken|breakdance|DANCE|Spinning on your head|break dance,breakdancing
broken|breakthrough|THROUGH|Big discovery|break through
cross|crossword|WORD|Newspaper puzzle
cross|crossroads|ROADS|A big decision point
cross|crossfire|FIRE|Caught in the middle of it
cross|crossbow|BOW|Medieval weapon
cross|crosswalk|WALK|Stripes for pedestrians
cross|cross-eyed|EYED|Looking at your own nose|crosseyed
round|round table|TABLE|King Arthur's furniture
round|round trip|TRIP|There and back again
round|round robin|ROBIN|Everyone plays everyone
round|year-round|YEAR|All the time|year round,all year round
square|square dance|DANCE|Do-si-do!
square|square meal|MEAL|A proper dinner
square|square root|ROOT|Math operation
square|square one|ONE|Back to the very start|square 1
half|halftime|TIME|Break in the big game
half|halfway|WAY|The midpoint
half|half moon|MOON|Lunar phase
half|half-baked|BAKED|Poorly thought out
half|half price|PRICE|Sale sticker
long|long shot|SHOT|Unlikely bet
long|long weekend|WEEKEND|Three days off
long|longhorn|HORN|Texas cattle
long|long distance|DISTANCE|Far-apart relationship
long|long story|STORY|"___ short..."
tall|tall tale|TALE|Exaggerated story
tall|tall order|ORDER|A difficult request
tall|tall ship|SHIP|Classic sailing vessel
double|double trouble|TROUBLE|Twice the mischief
double|double check|CHECK|Verify again
double|double take|TAKE|Surprised second look
double|double standard|STANDARD|Unfair rules
double|double agent|AGENT|Spy for both sides
double|bicycle|CYCLE|Two wheels, pedal power
double|biplane|PLANE|Vintage aircraft with stacked wings
triple|tricycle|CYCLE|A kid's first ride
triple|triangle|ANGLE|Three-sided shape
triple|tripod|POD|Camera stand
triple|triple threat|THREAT|Can sing, dance, and act
high|highway|WAY|Fast road
high|highlight|LIGHT|The best moment
high|high school|SCHOOL|Grades 9 to 12
high|high tide|TIDE|Sea at its peak
high|high noon|NOON|Showdown hour
high|highland|LAND|Scottish terrain|highlands
high|high five|5|Celebratory slap|high 5
high|high chair|CHAIR|Baby's seat at the table|highchair
low|lowlife|LIFE|Scoundrel
low|low tide|TIDE|Beach at its widest
low|lowland|LAND|Flat terrain near sea level|lowlands
low|low-key|KEY|Understated
low|low budget|BUDGET|Cheaply made
red|red carpet|CARPET|Celebrity walkway
red|red tape|TAPE|Bureaucracy
red|redhead|HEAD|Ginger
red|red alert|ALERT|Maximum danger
red|red flag|FLAG|A warning sign
blue|blue moon|MOON|A rare occurrence
blue|blueprint|PRINT|Architect's plan
blue|bluebird|BIRD|Songbird of happiness
blue|blue cheese|CHEESE|Moldy delicacy
blue|blue whale|WHALE|The largest animal ever
green|green light|LIGHT|Permission to go
green|greenhouse|HOUSE|Where plants spend winter
green|green thumb|THUMB|A talent for gardening
green|green card|CARD|US residency document
gold|goldfish|FISH|Bowl pet
gold|gold medal|MEDAL|First-place prize
gold|golden rule|RULE|Treat others as you'd like to be treated|gold rule
gold|gold mine|MINE|A rich source|goldmine
silver|silver lining|LINING|The bright side
silver|silverware|WARE|Forks and spoons
silver|silver screen|SCREEN|The movies
pink|pink slip|SLIP|You're fired
pink|pink eye|EYE|Contagious eye infection|pinkeye
gray|gray area|AREA|Not black-and-white
gray|gray matter|MATTER|Brain tissue
white|white lie|LIE|Harmless fib
white|whiteboard|BOARD|Classroom surface
white|white noise|NOISE|Sleep-aid sound
purple|purple heart|HEART|Military honor
brown|brown sugar|SUGAR|Baking sweetener
brown|brown bag|BAG|Packed lunch
thin|thin air|AIR|Vanished into ___
thin|thin crust|CRUST|Pizza style
wide|wide awake|AWAKE|Fully alert
wide|wide open|OPEN|Completely unguarded
wide|widescreen|SCREEN|Cinema-style TV format
wide|worldwide|WORLD|Global|world wide
side|sidewalk|WALK|Pavement
side|sideline|LINE|Edge of the field|sidelines
side|sidekick|KICK|The hero's helper
side|sideshow|SHOW|A distraction from the main event
fall|falling star|STAR|Make a wish!|shooting star
fall|nightfall|NIGHT|Dusk
fall|rainfall|RAIN|Precipitation total
fall|waterfall|WATER|Niagara, for one
rise|sunrise|SUN|Dawn
rise|rising star|STAR|An up-and-comer`;

  GENERATED.trim().split('\n').forEach(line => {
    const [rule, answer, base, hint, extra] = line.split('|');
    const R = RULES[rule];
    if (!R) { console.warn('Unknown rule', rule); return; }
    const alts = extra ? extra.split(',') : [];
    const first = answer.split(/[\s-]/)[0];
    if (SYN[first]) SYN[first].forEach(s => alts.push(answer.replace(first, s)));
    add('easy', answer, R.g(base), hint, alts.join(','), `${base} ${R.why}`);
  });

  /* ---------------------------------------------------------------
     2. DOODLE SUMS  (Warm-up pool): add up the pictures
     --------------------------------------------------------------- */
  const D = (a, g, h, alt) => add('easy', a, g, h, alt, 'Add up the pictures');
  D('rainbow', '@rain @bow', 'After the storm');
  D('starfish', '@star @fish', 'Five-armed sea creature');
  D('keyhole', '@key @hole', 'Peek through it');
  D('honeymoon', '@honey @moon', 'Trip after the wedding');
  D('sunglasses', '@sun @glasses', 'Summer eyewear', 'sun glasses');
  D('football', '@foot @ball', 'Kickoff!');
  D('bookworm', '@book @worm', 'Avid reader');
  D('watchdog', '@watch @dog', 'Vigilant guardian');
  D('butterfly', '@butter @fly', 'Garden flutterer');
  D('footnote', '@foot @note', 'Bottom-of-the-page remark');
  D('catfish', '@cat @fish', 'Whiskered swimmer');
  D('moonlight', '@moon @bulb', 'Nighttime glow');
  D('firefly', '@fire @fly', 'Glows on summer nights');
  D('eye candy', '@eye @candy', 'Easy on the eyes');
  D('hot dog', '@fire @dog', 'Ballpark snack', 'hotdog');
  D('snake eyes', '@snake @eye @eye', 'Double ones on the dice');
  D('lighthouse', '@bulb @house', 'Coastal beacon');
  D('earthworm', '@earth @worm', 'Garden digger');
  D('snail mail', '@snail @mail', 'Old-fashioned post');
  D('brainstorm', '@brain @bolt', 'Group idea session');
  D('doghouse', '@dog @house', "Where you are when you're in trouble", 'dog house');
  D('pancake', '@pan @cake', 'Breakfast stack', 'pancakes');
  D('sunflower', '@sun @flower', 'Tall yellow bloom');
  D('cupcake', '@cup @cake', 'Frosted treat');
  D('heartbeat', '@heart BEAT', 'Pulse');
  D('eyeball', '@eye @ball', 'Look at closely');
  D('time flies', '@clock @fly @fly', "...when you're having fun");
  D('sweet tooth', 'SWEET @tooth', 'Craves sugar');
  D('butterfingers', '@butter FINGERS', 'Clumsy catcher', 'butter fingers');
  D('doorbell', '@door @bell', 'Ding-dong!');
  D('doorman', '@door @man', 'Greets you at the hotel', 'doorkeeper');
  D('manhole', '@man @hole', 'Street-level hatch');
  D('treehouse', '@tree @house', 'Backyard hideout', 'tree house');
  D('birdhouse', '@bird @house', 'Nesting box', 'bird house');
  D('keyboard', '@key BOARD', 'Type on it');
  D('fireplace', '@fire PLACE', 'Cozy spot in winter');
  D('campfire', 'CAMP @fire', 'Toast marshmallows here');
  D('fireman', '@fire @man', 'Puts out blazes', 'firefighter');
  D('mailman', '@mail @man', 'Delivers letters', 'postman');
  D('chairman', '@chair @man', 'Runs the board meeting', 'chairperson');
  D('wheelchair', 'WHEEL @chair', 'Rolling seat');
  D('toothpaste', '@tooth PASTE', 'Squeeze the tube');
  D('toothpick', '@tooth PICK', 'After-dinner sliver');
  D('notebook', '@note @book', 'Jot things down in it');
  D('stopwatch', 'STOP @watch', 'Race timer');
  D('earthquake', '@earth QUAKE', 'Tremor');
  D('bedroom', '@bed ROOM', 'Where you sleep');
  D('flowerbed', '@flower @bed', 'Garden patch', 'flower bed');
  D('seabed', '@wave @bed', 'Ocean floor', 'sea bed');
  D('bedtime', '@bed @clock', 'Lights out!', 'bed time');
  D('eggshell', '@egg SHELL', 'Walk on these carefully', 'egg shell');
  D('egghead', '@egg HEAD', 'Brainy person');
  D('shoelace', '@shoe LACE', 'Tie it up', 'shoelaces');
  D('email', 'E+@mail', 'Check your inbox', 'e-mail');
  D('cupboard', '@cup BOARD', 'Kitchen storage');
  D('buttercup', '@butter @cup', 'Little yellow wildflower');
  D('Sunday', '@sun DAY', 'Day of rest');
  D('boathouse', '@boat @house', 'Lakeside shed');
  D('lifeboat', 'LIFE @boat', 'Abandon ship!');
  D('raindrop', '@rain @drop', 'Falls from the sky');
  D('bluebell', '@bell[blue]', 'Woodland flower');
  D('pie chart', '@pie CHART', 'Data in slices');
  D('pineapple', '@tree @apple', 'Spiky tropical fruit');
  D('clockwise', '@clock WISE', 'Same way the hands go');
  D('flashlight', 'FLASH @bulb', 'Torch', 'torch');
  D('sawdust', '@saw DUST', 'Woodshop floor covering');
  D('jigsaw', 'JIG+@saw', 'Thousand-piece puzzle');
  D('leaflet', '@leaf+LET', 'Folded handout');
  D('booklet', '@book+LET', 'Small pamphlet');

  /* ---------------------------------------------------------------
     2b. DOODLE SOUNDS  (Tricky pool): say the pictures out loud
     --------------------------------------------------------------- */
  const DS = (a, g, h, alt) => add('medium', a, g, h, alt, 'Say the pictures out loud');
  DS('I love you', '@eye @heart U', 'Three little words');
  DS('believe', '@bee LIEVE', 'Have faith');
  DS('belief', '@bee @leaf', 'Faith');
  DS('be careful', '@bee CAREFUL', 'Watch out!');
  DS('eyesore', '@eye SORE', 'Ugly sight');
  DS('I can see', '@eye @can @wave', 'Vision check: all clear', 'i can see you');
  DS('seesaw', '@wave @saw', 'Playground ride', 'see saw');
  DS('season', '@wave+SON', 'Spring, for one');
  DS('seal', '@wave+L', 'Barking sea mammal');
  DS('canteen', '@can 10', 'Water bottle (or cafeteria)');
  DS('candy', '@can+DY', 'Sweet treat');
  DS('pelican', 'PELI+@can', 'Big-billed bird');
  DS('pants', 'P+@ant+S', 'Trousers');
  DS('plant', 'PL+@ant', 'Water it daily');
  DS('giant', 'GI+@ant', 'Fee-fi-fo-fum!');
  DS('earring', '@ear @ring', 'Jewelry for your lobe', 'earrings');
  DS('heart', 'H+@ear+T', 'Beats in your chest');
  DS('early', '@ear+LY', 'Before time');
  DS('spring', 'SP+@ring', 'Season of blossoms');
  DS('belly', '@bell+Y', 'Tummy');
  DS('barbell', 'BAR+@bell', 'Gym weight');
  DS('carpet', '@car+PET', 'Floor covering');
  DS('cartoon', '@car+TOON', 'Saturday-morning show');
  DS('carrot', '@car+ROT', 'Bugs Bunny’s snack');
  DS('scar', 'S+@car', 'Old wound');
  DS('tiger', '@tie+GER', 'Striped big cat');
  DS('tidy', '@tie+DY', 'Neat and clean');
  DS('elbow', 'EL+@bow', 'Arm joint');
  DS('bowl', '@bow+L', 'Cereal dish');
  DS('bonfire', '@bone @fire', 'Big outdoor blaze');
  DS('trombone', 'TROM+@bone', 'Slide instrument');
  DS('selfish', 'SEL+@fish', 'Thinks only of me, me, me');
  DS('peanut', '@pea+NUT', 'Ballpark snack in a shell');
  DS('peacock', '@pea+COCK', 'Bird with a showy tail');
  DS('peace', '@pea+CE', 'Opposite of war');
  DS('pirate', '@pie+RATE', 'Arr, matey!');
  DS('magpie', 'MAG+@pie', 'Bird that loves shiny things');
  DS('appear', 'AP+@pear', 'Show up');
  DS('pearl', '@pear+L', 'Oyster’s treasure');
  DS('ballet', '@ball+ET', 'Dance on tiptoe');
  DS('sparrow', 'SP+@arrow', 'Small brown bird');
  DS('narrow', 'N+@arrow', 'Not wide');
  DS('hiccup', 'HIC+@cup', 'Hold your breath to stop it', 'hiccough');
  DS('panda', '@pan+DA', 'Bamboo muncher');
  DS('Japan', 'JA+@pan', 'Land of the rising sun');
  DS('panic', '@pan+IC', "Don't ___!");
  DS('what', 'W+@hat', 'Pardon?');
  DS('chat', 'C+@hat', 'Have a natter');
  DS('hatch', '@hat+CH', 'What eggs do');
  DS('brain', 'B+@rain', 'Thinking organ');
  DS('train', 'T+@rain', 'Rides the rails');
  DS('reindeer', '@rain+DEER', 'Pulls a sleigh');
  DS('monkey', 'MON+@key', 'Swings from trees');
  DS('donkey', 'DON+@key', 'Stubborn animal');
  DS('turkey', 'TUR+@key', 'Thanksgiving centerpiece');
  DS('diet', '@die+T', 'Cutting back on cake');
  DS('lightning', '@bulb+NING', 'Flash in a storm');
  DS('delight', 'DE+@bulb', 'Great pleasure');
  DS('catalog', '@cat+ALOG', 'Mail-order book', 'catalogue');
  DS('catastrophe', '@cat+ASTROPHE', 'Total disaster');
  DS('Germany', 'GER+@man+Y', 'Country of Berlin');
  DS('mango', '@man+GO', 'Tropical stone fruit');
  DS('birdie', '@bird+IE', 'One under par');
  DS('starling', '@star+LING', 'Murmuration bird');
  DS('eggplant', '@egg PL+@ant', 'Purple veggie', 'aubergine');
  DS('snakes and ladders', '@snake+S & @ladder+S', 'Board game of ups and downs', 'chutes and ladders');
  DS('the early bird', '@ear+LY @bird', '...catches the worm', 'early bird');
  DS('catnap', '@cat ZZZ', 'Short doze', 'cat nap');
  DS('on fire', '@man\n@fire', 'Playing brilliantly', "you're on fire");
  DS('brainwave', '@brain @wave', 'Sudden bright idea', 'brain wave');
  DS('an eye for an eye', '@eye 4 @eye', 'Old law of revenge', 'eye for eye');

  /* ---------------------------------------------------------------
     3. SOUND IT OUT  (Tricky pool)
     --------------------------------------------------------------- */
  const S = (a, g, h, alt) => add('medium', a, g, h, alt, `Say "${g.replace(/ /g, ' ')}" out loud`);
  S('before', 'B4', 'Prior to');
  S('today', '2DAY', 'Not yesterday');
  S('tonight', '2NIGHT', 'This evening');
  S('together', '2GETHER', 'As a team');
  S('tomorrow', '2MORROW', 'Not today');
  S('toucan', '2CAN', 'Bird with a colorful bill');
  S('tulip', '2LIP', 'Spring bulb flower');
  S('forecast', '4CAST', 'Weather prediction');
  S('forehead', '4HEAD', 'Above your eyebrows');
  S('fortune', '4TUNE', 'Wealth, or what a cookie tells');
  S('forbid', '4BID', 'Prohibit');
  S('great', 'GR8', 'Excellent!');
  S('later', 'L8R', 'See you ___');
  S('skate', 'SK8', 'Glide on ice');
  S('wait', 'W8', 'Hold on');
  S('plate', 'PL8', 'Dinner dish');
  S('often', 'OF10', 'Frequently');
  S('tennis', '10NIS', 'Racket sport');
  S('kitten', 'KIT10', 'Young cat');
  S('mitten', 'MIT10', 'Winter hand-warmer');
  S('attention', 'AT10TION', 'Listen up!');
  S('written', 'WRIT10', 'Not spoken');
  S('someone', 'SOME1', 'A person');
  S('anyone', 'ANY1', 'Whoever');
  S('everyone', 'EVERY1', 'All the people', 'everybody');
  S('no one', 'NO1', 'Nobody', 'noone');
  S('wonderful', '1DERFUL', 'Marvelous');
  S('excel', 'XL', 'To shine (or a spreadsheet)');
  S('excellent', 'XLNT', 'Top-notch');
  S('energy', 'NRG', 'Get-up-and-go');
  S('easy', 'EZ', 'Not hard');
  S('icy', 'IC', 'Slippery and cold');
  S('empty', 'MT', 'Nothing inside');
  S('cutie', 'QT', 'Adorable person');
  S('decay', 'DK', 'Rot');
  S('essay', 'SA', 'School writing task');
  S('excess', 'XS', 'Too much');
  S('exit', 'XIT', 'The way out');
  S('expert', 'XPERT', 'Specialist');
  S('I owe you', 'IOU', 'A promise to pay');
  S('tea for two', 'T 4 2', 'A cozy cuppa for a couple');
  S('barbecue', 'BAR B Q', 'Backyard grill party', 'barbeque,bbq');
  S('seashell', 'C SHELL', 'Beach find', 'sea shell');
  S('seasick', 'C SICK', 'Queasy on a boat', 'sea sick');
  S('seagull', 'C GULL', 'Chip thief at the beach', 'sea gull');
  S('teapot', 'T POT', 'Short and stout', 'tea pot');
  S('I see you', 'I C U', 'Peekaboo!');
  S('see you later', 'C U L8R', 'Goodbye!', 'see ya later');
  S('tepee', 'TP', 'Cone-shaped tent', 'teepee,tipi');
  S('ivy', 'IV', 'Climbing plant');
  S('deviate', 'DV8', 'Stray from the path');

  /* ---------------------------------------------------------------
     4. HAND-MADE  (Tricky + Brain-bender pools)
     add(tier, answer, grid, hint, alts, why)
     --------------------------------------------------------------- */
  const M = (...x) => add('medium', ...x);
  const H = (...x) => add('hard', ...x);

  M('scrambled eggs', 'GSGE', 'Breakfast classic', '', 'EGGS, scrambled');
  M('forever', 'EVER EVER EVER EVER', 'For all time', 'for ever', 'Four EVERs');
  M('backward glance', 'GLANCE[rev]', 'A look over your shoulder', 'backwards glance', 'GLANCE, backward');
  M('seeing double', 'SEEING[double]', 'Had one too many?', '', 'SEEING, doubled');
  M('blurred vision', 'VISION[blur]', 'Time for new glasses', 'blurry vision', 'VISION, blurred');
  M('tickled pink', 'TICKLED[pink]', 'Absolutely delighted', '', 'TICKLED in pink');
  M('green with envy', 'NV[green]', 'Jealous', '', 'NV (envy) in green');
  M('feeling blue', 'FEELING[blue]', 'Down in the dumps', '', 'FEELING in blue');
  M('caught red-handed', 'CAUGHT HANDED[red]', 'Busted in the act', 'red handed,red-handed,redhanded', 'CAUGHT, with HANDED in red');
  M('golden opportunity', 'OPPORTUNITY[gold]', 'The chance of a lifetime', 'gold opportunity', 'OPPORTUNITY in gold');
  M('forgive and forget', '4GIVE & 4GET', 'Let bygones be bygones', '', '4-GIVE & 4-GET');
  M('word for word', 'WORD 4 WORD', 'Exactly as written', '', 'WORD 4 WORD');
  M('to be or not to be', '2B OR NOT 2B', 'Hamlet ponders', 'that is the question', '2B OR NOT 2B');
  M('the bottom line', '.\n.\n.\nLINE', 'What it all comes down to', 'bottom line', 'LINE at the bottom');
  M('top secret', 'SECRET\n.\n.\n.', 'Classified', '', 'SECRET at the top');
  M('rock bottom', '.\n.\n.\nROCK', 'The lowest point', 'hit rock bottom', 'ROCK at the bottom');
  M('growing pains', 'PAINS[grow]', 'Teenage troubles', '', 'PAINS, growing');
  M('split personality', 'PERSONALITY[split]', 'Two sides to someone', '', 'PERSONALITY, split');
  M('out of order', 'RODER', 'Sign on a broken machine', '', 'ORDER, out of order');
  M('mixed signals', 'SNGLAIS', 'Confusing messages', 'mixed signal', 'SIGNALS, mixed up');
  M('jack in the box', 'JACK[box]', 'Pop-up toy', 'jack-in-the-box,jack in a box', 'JACK in a box');
  M('life after death', 'DEATH LIFE', 'The great beyond', '', 'LIFE comes after DEATH');
  M('good afternoon', 'NOON GOOD', 'A midday greeting', '', 'GOOD comes after NOON');
  M('head over heels', 'HEAD\n---\nHEELS', 'Hopelessly in love', '', 'HEAD over HEELS');
  M('mind over matter', 'MIND\n---\nMATTER', 'Willpower wins', '', 'MIND over MATTER');
  M('man overboard', 'MAN\n---\nBOARD', 'Cry from the deck', 'man over board', 'MAN over BOARD');
  M('time after time', 'TIME TIME', 'Again and again', '', 'TIME after TIME');
  M('circle of friends', 'FRIENDS[ring]', 'Your social group', 'friend circle,friendship circle', 'FRIENDS in a circle');
  M('unfinished business', 'BUSINE', 'Something left to settle', '', 'BUSINESS, unfinished');
  M('cut short', 'SHOR', 'Ended early', '', 'SHORT, cut short');
  M('parallel parking', 'PARKING\nPARKING', 'Tricky driving-test maneuver', 'parallel park', 'PARKING, in parallel');
  M('think big', 'THINK[xl]', 'Dream large', '', 'THINK, written big');
  M('eggs over easy', 'EGGS\n---\nEASY', 'Diner breakfast order', '', 'EGGS over EASY');
  M('I understand', 'STAND\n---\nI', 'Got it!', '', 'I under STAND');

  H('water under the bridge', 'BRIDGE\n---\nWATER', 'Past troubles, forgiven', '', 'WATER under the BRIDGE');
  H('misunderstood', 'STOOD\n---\nMIS', 'Not properly grasped', '', 'MIS under STOOD');
  H('long underwear', 'WEAR\n---\nLONG', 'Winter base layer', 'long johns', 'LONG under WEAR');
  H('travel overseas', 'TRAVEL\n---\nC C C C C C', 'Go abroad', 'travel over seas,travel over the seas', "TRAVEL over C's");
  H('six feet underground', 'GROUND\n---\nFEET FEET FEET\nFEET FEET FEET', 'Buried', '6 feet underground,six feet under', 'Six FEET under GROUND');
  H('three degrees below zero', '0\n---\nB.A. M.A. PH.D.', 'Very chilly', '3 degrees below zero,three degrees below', 'Three degrees below zero (0)');
  H('history repeats itself', 'HISTORY\nHISTORY\nHISTORY', 'The past comes around again', 'history repeats', 'HISTORY, repeated');
  H('paint the town red', 'PAINT TOWN[red]', 'A big night out', '', 'PAINT, then TOWN in red');
  H('once upon a time', 'ONCE\nTIME', 'Fairy-tale opener', '', 'ONCE on top of TIME');
  H('hand in hand', 'H+HAND[blue]+AND', 'Together, side by side', '', 'HAND inside HAND');
  H('once in a blue moon', 'MO[blue]+ONCE+ON[blue]', 'Very rarely', '', 'ONCE inside a blue MOON');
  H('just in time', 'TI+JUST[blue]+ME', 'At the last second', '', 'JUST inside TIME');
  H("you're under arrest", "ARREST\n---\nYOU'RE", 'Hands where I can see them', 'you are under arrest', "YOU'RE under ARREST");
  H('reading between the lines', '---\nREADING\n---', 'Finding the hidden meaning', '', 'READING between the lines');
  H('all in all', 'A+ALL[blue]+LL', 'On the whole', '', 'ALL inside ALL');
  H('think outside the box', '~~~~[box] THINK', 'Be creative', 'thinking outside the box', 'THINK, outside the box');
  H('head in the sand', 'SA+HEAD[blue]+ND', 'Ignoring the problem', '', 'HEAD inside SAND');
  H('one in a million', 'MILL+ONE[blue]+ION', 'Truly special', '1 in a million', 'ONE inside MILLION');
  H('foot in the door', 'DO+FOOT[blue]+OR', 'A first opportunity', '', 'FOOT inside DOOR');
  H('pie in the sky', 'S+PIE[blue]+KY', 'An unrealistic dream', '', 'PIE inside SKY');
  H('sleeping on the job', 'SLEEPING\nJOB', 'Slacking at work', '', 'SLEEPING on JOB');
  H('tongue in cheek', 'CHE+TONGUE[red]+EK', 'Not meant seriously', 'tongue-in-cheek', 'TONGUE inside CHEEK');
  H('frog in the throat', 'THR+FROG[green]+OAT', 'A hoarse voice', 'frog in your throat,frog in my throat', 'FROG inside THROAT');
  H('hole in one', 'H+ONE[blue]+OLE', "A golfer's dream", 'hole in 1', 'ONE inside HOLE');
  H('head in the clouds', 'CLO+HEAD[blue]+UDS', 'Daydreaming', '', 'HEAD inside CLOUDS');
  H('big fish in a small pond', 'PO[xs]+FISH[xl]+ND[xs]', 'Important, but only locally', 'big fish small pond', 'A big FISH inside a small POND');
  H('trouble in paradise', 'PARA+TROUBLE[red]+DISE', 'Relationship strife', '', 'TROUBLE inside PARADISE');
  H('feeling under the weather', 'WEATHER\n---\nFEELING', 'A bit unwell', 'under the weather', 'FEELING under the WEATHER');
  H('hit below the belt', 'BELT\n---\nHIT', 'An unfair blow', 'below the belt', 'HIT below the BELT');
  H('up in arms', 'AR+UP[red]+MS', 'Furious and protesting', '', 'UP inside ARMS');
  H('cash in hand', 'HA+CASH[green]+ND', 'Paid informally', '', 'CASH inside HAND');
  H('bun in the oven', 'OV+BUN[orange]+EN', 'Expecting a baby', '', 'BUN inside OVEN');
  H('shot in the dark', 'DA+SHOT[red]+RK', 'A wild guess', '', 'SHOT inside DARK');
  H('ants in your pants', 'P+ANTS[red]', "Can't sit still", 'ants in my pants,ants in his pants,ants in her pants,ants in pants', 'ANTS inside PANTS');
  H('a bird in the hand', 'HA+BIRD[blue]+ND', '...is worth two in the bush', '', 'BIRD inside HAND');
  H('lost in space', 'SP+LOST[purple]+ACE', 'Adrift among the stars', '', 'LOST inside SPACE');
  H("it's a small world after all", 'ALL WORLD[xs]', 'A remark on a happy coincidence', 'small world after all,its a small world after all', 'A small WORLD, after ALL');
  H("he's beside himself", "HE'S HIMSELF", 'Overwrought', 'he is beside himself,beside himself', "HE'S beside HIMSELF");
  H('skating on thin ice', 'SKATING\nICE[thin]', 'Taking a big risk', 'on thin ice', 'SKATING on thin ICE');
  H('a cut above the rest', 'CUT\n---\nREST', 'Superior', 'cut above', 'CUT above REST');
  H('lean on me', 'LEAN[tilt]\nME', 'An offer of support', '', 'LEAN on ME');
  H('a stitch in time', 'TI+STITCH[red]+ME', '...saves nine', '', 'STITCH inside TIME');
  H('two peas in a pod', 'PO+PEA[green]+PEA[green]+D', 'Inseparable pair', 'like two peas in a pod,2 peas in a pod', 'Two PEAs inside POD');
  H('on cloud nine', '@man\n@cloud 9', 'Blissfully happy', 'on cloud 9,cloud nine,cloud 9', 'Someone on cloud nine');
  H('raining cats and dogs', '@rain\n@cat @dog @cat\n@dog @cat @dog', 'Absolutely pouring', "it's raining cats and dogs", 'Rain of cats and dogs');
  H('anticlockwise', '@clock[mirror]', 'The other way round', 'counterclockwise,counter clockwise,anti-clockwise,anti clockwise', 'A mirrored clock');
  H('see eye to eye', '@wave @eye 2 @eye', 'Fully agree', 'see eye 2 eye', 'SEA, EYE, 2, EYE');
  H('a bee in your bonnet', 'BON+@bee+NET', 'An obsession you keep buzzing about', 'bee in your bonnet,bee in my bonnet,bee in her bonnet,bee in his bonnet', 'A BEE inside BONNET');
  H('fish out of water', '@fish\n@wave', 'Feeling out of place', 'a fish out of water,like a fish out of water', 'A FISH out of the water');
  H('a drop in the ocean', 'OCE+@drop+AN', 'A tiny contribution to a huge problem', 'drop in the ocean,a drop in the bucket', 'A DROP inside OCEAN');
  H('elephant in the room', 'RO+ELEPH+@ant+OM', 'The obvious issue nobody mentions', '', 'An elephant inside ROOM');
  H('mother-in-law', 'MOTH+LAW[blue]+ER', 'Spouse’s parent', 'mother in law', 'LAW inside MOTHER');
  H('keep in touch', 'TOU+KEEP[blue]+CH', "Don't be a stranger", '', 'KEEP inside TOUCH');
  H('fingers crossed', 'FINGERS[cross]', 'Hoping for luck', 'crossed fingers,cross your fingers,keep your fingers crossed', 'FINGERS, crossed');
  H('repeat after me', 'ME REPEAT', 'A teacher’s instruction', '', 'REPEAT after ME');
  H('laid back', 'LAID[rev]', 'Relaxed and easy-going', 'laidback', 'LAID, written back');
  H('back in a minute', 'MIN+BACK[rev,blue]+UTE', 'Note on a shop door', 'be back in a minute,back in a min', 'BACK (backward) inside MINUTE');
  H('turn back time', 'TIME[rev]', 'Undo the past', 'turn back the time,turning back time', 'TIME, turned back');
  H('safety in numbers', '12+SAFETY[blue]+34', 'Why herds stick together', '', 'SAFETY inside numbers');
  H('pain in the neck', 'NE+PAIN[red]+CK', 'A real nuisance', 'a pain in the neck', 'PAIN inside NECK');
  H('fly in the ointment', 'OINT+FLY[red]+MENT', 'A small flaw that spoils things', 'a fly in the ointment', 'FLY inside OINTMENT');


  /* ---------------------------------------------------------------
     5. EXTRA SET  (phrases inspired by printable rebus answer lists,
        with new layouts drawn in Rebusday's own style)
     --------------------------------------------------------------- */
  // Warm-up
  add('easy', 'long legs', 'LEGS[long]', 'A stilt-walker’s look', '', 'LEGS, stretched long');
  add('easy', 'stepfather', 'FATHER[rise]', 'Mum’s new husband', 'step father,step-father', 'FATHER climbing steps');
  add('easy', 'wake up', 'WAKE[vup]', 'Rise and shine', 'waking up', 'WAKE reading upward');
  add('easy', 'warm up', 'WARM[vup]', 'Stretch before exercise', 'warmup,warm-up', 'WARM reading upward');
  add('easy', 'pop up', 'POP[vup]', 'Appear out of nowhere', 'popup,pop-up', 'POP reading upward');
  add('easy', 'check up', 'CHECK[vup]', 'A visit to the doctor', 'checkup,check-up', 'CHECK reading upward');
  add('easy', 'brighten up', 'BRIGHTEN[vup]', 'Cheer up', '', 'BRIGHTEN reading upward');
  add('easy', 'uproar', 'ROAR[vup]', 'A noisy outcry', 'up roar', 'ROAR reading upward');
  add('easy', 'die down', 'DIE[vert]', 'Fade away', 'dies down,dying down', 'DIE reading downward');
  add('easy', 'apple pie', '@apple @pie', 'Classic dessert', '', 'Add up the pictures');
  add('easy', 'honeybee', '@honey @bee', 'Makes the sweet stuff', 'honey bee', 'Add up the pictures');
  add('easy', 'catwalk', '@cat WALK', 'Fashion runway', 'cat walk', 'CAT + WALK');
  add('easy', 'sandbox', 'SAND[box]', 'Kids dig in it', 'sand box,sandpit', 'SAND inside a box');
  add('easy', 'lovebirds', '@heart @bird @bird', 'A smitten couple', 'love birds', 'LOVE + BIRDS');
  add('easy', 'rain check', '@rain CHECK', 'Can we do this another time?', 'raincheck', 'RAIN + CHECK');
  add('easy', 'light rain', '@bulb @rain', 'Just a drizzle', '', 'LIGHT + RAIN');
  add('easy', 'sunroof', '@sun ROOF', 'Car-top window', 'sun roof', 'SUN + ROOF');
  add('easy', 'teacup', 'T @cup', 'The saucer’s partner', 'tea cup', 'T (tea) + CUP');
  add('easy', 'back burner', 'BURNER[rev]', 'Where low-priority plans go', 'backburner', 'BURNER written backward');
  add('easy', 'eyeliner', '@eye LINER', 'Makeup pencil', 'eye liner', 'EYE + LINER');
  add('easy', 'streetlight', 'STREET @bulb', 'Lamp-post glow', 'street light,streetlamp', 'STREET + LIGHT');
  add('easy', 'dog bowl', '@dog @bow+L', 'Where Rover eats', 'dogbowl', 'DOG + BOW-L');
  add('easy', 'daybreak', 'DAY[scatter]', 'Dawn', 'break of day', 'DAY, broken');
  add('easy', 'groundbreaking', 'GROUND[scatter]', 'Revolutionary', 'ground breaking,ground-breaking', 'GROUND, broken');
  add('easy', 'high-rise', 'RISE\n.\n.\n---', 'Tall apartment block', 'high rise,highrise', 'RISE up high');
  add('easy', 'Greenland', 'LAND[green]', 'Huge icy island', 'green land', 'LAND in green');
  add('easy', 'Bluetooth', '@tooth[blue]', 'Wireless pairing', 'blue tooth', 'A blue TOOTH');
  add('easy', 'crossbar', 'BAR[cross]', 'Top of the goal', 'cross bar', 'BAR, crossed');
  add('easy', 'fall asleep', 'ASLEEP[fall]', 'Drift off', 'falling asleep,fell asleep', 'ASLEEP, falling');
  add('easy', 'code red', 'CODE[red]', 'Highest alert', '', 'CODE in red');

  // Tricky
  const XM = (a, g, h, alt, why) => add('medium', a, g, h, alt, why || 'Say it out loud');
  XM('forget it', '4GET IT', 'Never mind', 'forget about it');
  XM('potatoes', "POT 8 O'S", 'Mashed, fried or baked', 'potato', "POT-8-O's");
  XM('3D movie', 'D D D MOVIE', 'Glasses required', '3-d movie,three d movie,3d film,3d movies', 'Three Ds + MOVIE');
  XM('big bad wolf', 'BAD[xl] WOLF', 'He huffed and he puffed', 'the big bad wolf', 'A big BAD, then WOLF');
  XM('no idea', 'IDEA[strike]', 'Haven’t a clue', '', 'IDEA crossed out');
  XM('comfortable', 'COM 4 TABLE', 'Cozy');
  XM('foreign language', '4+@rain LANGUAGE', 'Something you might learn abroad', 'foreign languages', '4 + RAIN + LANGUAGE');
  XM('afternoon tea', 'NOON T', 'Scones at four', '', 'T comes after NOON');
  XM('polite', 'PO+@bulb', 'Well-mannered', '', 'PO + LIGHT');
  XM('coffee break', 'COFFEE[scatter]', 'Time for a cuppa', '', 'COFFEE, broken');
  XM('multiple choice', 'CHOICE CHOICE\nCHOICE CHOICE', 'A, B, C or D?', '', 'Multiple CHOICEs');
  XM('Iran', '@eye RAN', 'Country next to Iraq', '', 'I + RAN');
  XM('boxing ring', '@ring[box]', 'Where boxers meet', '', 'A RING in a box');
  XM('houseplant', '@house PL+@ant', 'Fern on the windowsill', 'house plant', 'HOUSE + PL-ANT');
  XM('tennis shoes', '10+NIS @shoe @shoe', 'Court footwear', 'tennis shoe', 'TEN-NIS + SHOES');
  XM('fortunate', '4TUNE 8', 'Lucky', '', 'FOR-TUNE-8');
  XM('a bone to pick', '@bone 2 PICK', 'A complaint to raise', 'bone to pick', 'BONE 2 PICK');
  XM('breaking point', 'POINT[scatter]', 'The last straw', '', 'POINT, breaking');
  XM('sleep on it', 'SLEEP\nIT', 'Decide tomorrow', '', 'SLEEP on IT');
  XM('door to door', '@door 2 @door', 'Like a traveling salesperson', 'door-to-door', 'DOOR 2 DOOR');
  XM('holy man', '@hole+Y @man', 'Monk or sage', 'holyman', 'HOLE-Y + MAN');
  XM('peasants', '@pea @ant+S', 'Medieval farmhands', 'peasant', 'PEA + ANTS');
  XM('beetroot', '@bee+T ROOT', 'Purple salad veg', 'beet root,beet', 'BEE-T + ROOT');
  XM('canine', '@can 9', 'Doglike', 'k9', 'CAN + NINE');
  XM('canoe', '@can+U', 'Paddle boat', '', 'CAN + U');
  XM('careers', '@car @ear @ear', 'Lifetime jobs', 'career', 'CAR + EARS');
  XM('tyrant', '@tie+R @ant', 'Cruel ruler', '', 'TIE-R + ANT');
  XM('tender', '10+DER', 'Gentle (or sore)', '', 'TEN-DER');
  XM('relieves', 'RE+@leaf+S', 'Eases the pain', 'relieve', 'RE + LEAVES');
  XM('beacon', '@bee+CON', 'Signal light', '', 'BEE + CON');
  XM('forage', '4 RAGE', 'Hunt for food', '', '4 + RAGE');
  XM('I forget', '@eye 4GET', 'It slipped my mind', 'i forgot', 'EYE + 4-GET');
  XM('spy', 'S+@pie', 'Secret agent', '', 'S + PIE');
  XM('parent', '@pear+ENT', 'Mom or dad', '', 'PEAR + ENT');
  XM('hot plate', '@fire PL8', 'Cooking ring', 'hotplate', 'HOT + PL-8');
  XM('parrot', '@pear+ROT', 'Talking bird', '', 'PEAR + ROT');
  XM('daisy', 'DAY+Z', 'White-petaled flower', '', 'DAY + Z');
  XM('alpine', 'L+@tree', 'Of high mountains', '', 'L + PINE');
  XM('four-leaf clover', '@leaf @leaf\n@leaf @leaf', 'A lucky find', 'four leaf clover,4 leaf clover,four-leaved clover', 'Four LEAVES');
  XM('manager', '@man+AGE+R', 'The boss', '', 'MAN + AGE + R');
  XM('gnome', 'NO+M', 'Garden statue with a pointy hat', '', 'NO + M');
  XM('pillows', '@pill+O+S', 'Soft things on a bed', 'pillow', "PILL + O's");
  XM('wok', 'W+OK', 'Stir-fry pan', '', 'W + OK');
  XM('wave goodbye', '@wave BYE', 'Bid farewell', 'wave bye', 'WAVE + BYE');
  XM('forest', '4EST', 'Lots of trees', '', '4 + EST');
  XM('ideal', '@eye DEAL', 'Perfect', '', 'EYE + DEAL');
  XM('microwave', '@wave[sm]', 'Quick reheat', 'micro wave', 'A tiny WAVE');
  XM('springtime', 'SP+@ring @clock', 'Season of blossoms', 'spring time', 'SP-RING + TIME');
  XM('candle', '@can+DLE', 'Blow it out on your birthday', '', 'CAN + DLE');
  XM('dialogue', '@die A LOG', 'A conversation', 'dialog', 'DIE + A + LOG');
  XM('exercise', 'XR+SIZE', 'A workout', '', 'X-R + SIZE');
  XM('icicle', '@eye CYCLE', 'A frozen drip', '', 'EYE + CYCLE');
  XM('sealant', '@wave+L @ant', 'Waterproof filler', '', 'SEA-L + ANT');
  XM('foreigners', '4+@rain+ERS', 'Visitors from abroad', 'foreigner', '4 + RAIN + ERS');
  XM('rebate', 'REB+8', 'Money back', '', 'REB-8');
  XM('boulder', '@bow+L+DER', 'A huge rock', '', 'BOW-L + DER');
  XM('pillage', '@pill+AGE', 'Loot and plunder', '', 'PILL + AGE');
  XM('foreground', '4 GROUND', 'The front of the picture', '', '4 + GROUND');
  XM('empires', 'M+@pie+R+S', 'Rome and Persia, for two', 'empire', 'M + PIE + R + S');
  XM('sausage', '@saw SAGE', 'A banger on the grill', 'sausages', 'SAW + SAGE');
  XM('quiche', '@key+SH', 'Eggy tart', '', 'KEY + SH');
  XM('run around in circles', 'RUNRUNRUN[ring]', 'Get nowhere fast', 'running around in circles,go around in circles,running in circles', 'RUN, round in a circle');
  XM('topsoil', 'SOIL\n.\n.\n.', 'The gardener’s upper layer', 'top soil', 'SOIL at the top');
  XM('time warp', 'TIME[wave]', 'Sci-fi glitch in history', 'timewarp', 'TIME, warped');
  XM('wavelength', '@wave[long]', 'On the same ___', 'wave length', 'A long WAVE');
  XM('icing', '@eye SING', 'Cake topping', '', 'EYE + SING');
  XM('antelope', '@ant+ELOPE', 'Fast grazing animal', '', 'ANT + ELOPE');

  // Brain-bender
  const XH = (a, g, h, alt, why) => add('hard', a, g, h, alt, why);
  XH('for once in my life', 'MY LI+1111[blue]+FE', 'Just this one time', 'for once', 'Four 1s (ones) in MY LIFE');
  XH('middle-aged', 'MID+AGED[blue]+DLE', 'Not young, not old', 'middle aged', 'AGED in the middle of MIDDLE');
  XH('long time no see', 'TIME[long]\nA B D E F', 'It’s been ages!', 'long time no c', 'A long TIME, and no C');
  XH('keep your eyes on the ball', '@eye @eye\n@ball', 'Stay focused', 'eyes on the ball,keep your eye on the ball,eye on the ball', 'EYES on the BALL');
  XH('a flash in the pan', 'P+FLASH[yellow]+AN', 'A short-lived success', 'flash in the pan', 'FLASH inside PAN');
  XH('peace on earth', '@pea+CE\n@earth', 'A seasonal wish', '', 'PEA-CE on EARTH');
  XH('just in case', 'CA+JUST[blue]+SE', 'To be on the safe side', '', 'JUST inside CASE');
  XH('to see stars', '2 @wave @star @star', 'Dazed after a bump on the head', 'see stars,seeing stars', '2 + SEA + STARS');
  XH('meet in the middle', 'MID+MEET[blue]+DLE', 'Compromise', '', 'MEET in the middle of MIDDLE');
  XH('turn over a new leaf', 'NEW @leaf[flip]', 'Make a fresh start', '', 'A NEW LEAF, turned over');
  XH('hole in the wall', 'WA+@hole+LL', 'A cash machine, or a tiny shop', 'a hole in the wall', 'A HOLE inside WALL');
  XH('four-wheel drive', 'WHEEL WHEEL\nDRIVE\nWHEEL WHEEL', 'Off-road capable', 'four wheel drive,4 wheel drive,4x4,4wd', 'Four WHEELs around DRIVE');
  XH('camping overnight', 'CAMPING\n---\nNIGHT', 'Under canvas till morning', 'camp overnight', 'CAMPING over NIGHT');
  XH('the birds and the bees', '@bird @bird & @bee @bee', 'The awkward talk', 'birds and the bees,birds and bees', 'BIRDS & BEES');
  XH('be on time', '@bee\n@clock', 'Punctual', 'be on-time', 'A BEE on a clock (TIME)');
  XH('bedtime story', '@bed @clock STORY', 'Read before lights out', 'bedtime stories,bed time story', 'BED + TIME + STORY');
  XH('search high and low', 'SEARCH\n.\n.\nSEARCH\n---', 'Look everywhere', 'searching high and low', 'SEARCH high, and SEARCH low');
  XH('a night on the town', 'NIGHT\nTOWN', 'An evening out', 'night on the town', 'NIGHT on TOWN');
  XH('down to earth', 'DOWN 2 @earth', 'Practical and unpretentious', 'down-to-earth', 'DOWN 2 EARTH');
  XH("I'm bigger than you", "I'M[xl] U[sm]", 'A playground boast', 'i am bigger than you', "A big I'M next to a small U");
  XH('try to understand', 'STAND\n---\nTRY 2', 'Please see my side', '', 'TRY 2 under STAND');
  XH('underdogs', '---\n@dog @dog', 'The ones nobody expects to win', 'underdog,the underdog,the underdogs', 'DOGS under the line');
  XH('kingfisher', '@crown @fish+ER', 'Bright blue diving bird', 'king fisher', 'KING + FISH + ER');
  XH('Peking duck', '@pea @crown DUCK', 'Crispy Beijing dish', '', 'PEA + KING + DUCK');


  /* ---------------------------------------------------------------
     6. HARDER SET  (classic phrases gathered from public rebus lists:
        Reader's Digest, Puzzle Prime, Sporcle, Designbeep, Yahoo,
        with new layouts drawn in Rebusday's own style)
     --------------------------------------------------------------- */
  const NE = (a, g, h, alt, why) => add('easy', a, g, h, alt, why);
  NE('big head', 'HEAD[xl]', 'Conceited', 'bighead,bigheaded,big-headed', 'A big HEAD');
  NE('high time', 'TIME\n.\n.\n---', 'Long overdue', '', 'TIME up high');
  NE('stand up', 'STAND[vup]', 'Rise from your seat', 'standup,stand-up', 'STAND reading upward');
  NE('sit down', 'SIT[vert]', 'Take a seat', 'sitdown,sit-down', 'SIT reading downward');

  const NM = (a, g, h, alt, why) => add('medium', a, g, h, alt, why);
  NM('split level', 'LEVEL[split]', 'House with half-floors', 'split-level', 'LEVEL, split');
  NM('growing economy', 'ECONOMY[grow]', 'Good news for markets', 'growing economies', 'ECONOMY, growing');
  NM('metaphor', 'META META META META', 'Figure of speech', '', 'META four times = meta-four');
  NM('Taiwan', '@tie 1', 'Island nation in East Asia', '', 'TIE + 1 (one)');
  NM('turncoat', 'COAT[flip]', 'Traitor', 'turn coat', 'COAT, turned over');
  NM('a piece of cake', '@pea+CE OF @cake', 'Super easy', 'piece of cake,peace of cake', 'PEA-CE (piece) OF CAKE');
  NM('lovestruck', '@heart @bolt', 'Smitten', 'love struck,love-struck', 'LOVE + STRUCK (by lightning)');
  NM('starstruck', '@star @bolt', 'Dazzled by a celebrity', 'star struck', 'STAR + STRUCK');
  NM('landslide', 'LAND[fall]', 'Overwhelming election win', 'land slide', 'LAND, sliding down');
  NM('pucker up', 'PUCKER[vup]', 'Get ready for a kiss', '', 'PUCKER reading upward');
  NM('go for it', 'GO 4 IT', 'Take the chance', '', 'GO 4 IT');
  NM('check in', 'CHE+IN[blue]+CK', 'Arrive at the hotel desk', 'check-in,checkin', 'IN inside CHECK');
  NM('look around', 'LOOK[ring]', 'Survey the scene', '', 'LOOK, written all around');
  NM('crossed wires', 'WIRES[cross]', 'A misunderstanding', 'cross wires,wires crossed,crossed lines', 'WIRES, crossed');
  NM('cross-examine', 'EXAMINE[cross]', 'Grill a witness', 'cross examine,cross examination', 'EXAMINE, crossed');
  NM('bottoms up', 'BOTTOMS[vup]', 'Cheers!', '', 'BOTTOMS reading upward');
  NM('falling behind', 'BEHIND[fall]', 'Not keeping up', 'fall behind,fell behind', 'BEHIND, falling');
  NM('falling in love', 'LOVE[fall]', 'Getting smitten', 'fall in love,fell in love', 'LOVE, falling');
  NM('rising prices', 'PRICES[rise]', 'Inflation', 'rising price,prices rising', 'PRICES, rising');
  NM('small fortune', '4TUNE[sm]', 'A lot of money, ironically', 'a small fortune', 'A small 4-TUNE');
  NM('square deal', 'DEAL[box]', 'A fair trade', '', 'DEAL in a square');
  NM('round of applause', 'APPLAUSE[ring]', 'Let’s hear it!', '', 'APPLAUSE, in a round');
  NM('circle back', 'BACK[ring]', 'Revisit it later', '', 'BACK, in a circle');
  NM('mirror image', 'IMAGE[mirror]', 'An exact reversal', '', 'IMAGE, mirrored');
  NM('upside-down cake', '@cake[flip]', 'Pineapple dessert', 'upside down cake', 'CAKE, upside down');
  NM('copycat', '@cat @cat', 'Imitator', 'copy cat', 'A CAT and its copy');
  NM('fat cat', '@cat[xl]', 'A wealthy bigwig', 'big cat', 'A fat CAT');
  NM('top dog', '@dog\n.\n.\n.', 'The boss', '', 'DOG at the top');
  NM('dog-eared', '@dog @ear', 'Pages with folded corners', 'dog eared,dog ear', 'DOG + EAR');
  NM('all ears', '@ear @ear @ear @ear @ear', 'Listening closely', '', 'Nothing but EARS');
  NM("time's up", 'TIME[vup]', 'The clock has run out', 'times up,time is up', 'TIME going up');
  NM('rain or shine', '@rain OR @sun', 'Whatever the weather', '', 'RAIN or SUN (shine)');
  NM('rise and shine', 'RISE & @sun', 'Wake up!', '', 'RISE & SUN (shine)');
  NM('moonlighting', '@moon @bulb+ING', 'Working a second job', 'moonlight', 'MOON + LIGHT + ING');
  NM('ring a bell', '@ring A @bell', 'Sounds familiar', 'rings a bell', 'RING + A + BELL');
  NM('bell-bottoms', '.\n.\n.\n@bell @bell', 'Flared trousers', 'bell bottoms,bell bottom', 'BELLs at the bottom');
  NM('key to success', '@key 2 SUCCESS', 'The secret to winning', 'the key to success', 'KEY 2 SUCCESS');
  NM('on the house', '@man\n@house', 'Free of charge', '', 'Someone on the HOUSE');
  NM('the Big Apple', '@apple[xl]', 'New York City’s nickname', 'big apple,new york,new york city', 'A big APPLE');
  NM('easy as pie', 'EZ AS @pie', 'No trouble at all', '', 'EZ AS PIE');
  NM('cup of tea', 'T\n@cup', 'Your favorite thing (or not)', 'my cup of tea,not my cup of tea', 'T in a CUP');
  NM('black hole', '@hole', 'Space swallows light here', '', 'A black HOLE');
  NM('can of worms', '@can @worm @worm', 'Opening up trouble', 'a can of worms', 'CAN + WORMS');
  NM('queen bee', '@crown @bee', 'Leader of the clique', '', 'CROWN (royal) + BEE');
  NM('king-size', '@crown SIZE', 'Extra large', 'king size,king sized', 'CROWN (king) + SIZE');
  NM('kingdom', '@crown+DOM', 'A monarch’s realm', '', 'CROWN (king) + DOM');
  NM('all in one', 'A+1[blue]+LL', 'Combined', 'all-in-one', '1 inside ALL');
  NM('one after another', 'ANOTHER ONE', 'In sequence', '', 'ONE after ANOTHER');
  NM('back to back', 'KCAB+BACK', 'Consecutive', 'back-to-back', 'BACK against BACK');
  NM('face to face', 'FACE 2 FACE', 'In person', 'face-to-face', 'FACE 2 FACE');
  NM('heads up', 'HEAD[vup]', 'Watch out!', 'head up', 'HEAD reading upward');
  NM('get your ducks in a row', 'DUCK DUCK DUCK DUCK', 'Get organized', 'ducks in a row', 'DUCKs in a row');
  NM('stay overnight', 'STAY\n---\nNIGHT', 'Sleep over', 'stay over night', 'STAY over NIGHT');
  NM('over and over', 'OVER OVER', 'Repeatedly', 'over & over', 'OVER and OVER');
  NM('watch your step', '@watch STEP[rise]', 'Careful now!', '', 'WATCH + STEPs');
  NM('easy come easy go', 'EZ COME EZ GO', 'What happens, happens', 'easy come, easy go', 'EZ COME EZ GO');

  const NH = (a, g, h, alt, why) => add('hard', a, g, h, alt, why);
  NH('a step backwards', 'STEP[rev]', 'A regression', 'step backwards,step backward,a step backward,step back', 'STEP, backwards');
  NH('time to reflect', 'TIME[mirror]', 'Look back and think', 'time for reflection,reflection time,reflect on time', 'TIME, reflected');
  NH('all over again', 'ALL\n---\nAGAIN', 'Once more from the top', '', 'ALL over AGAIN');
  NH('win with ease', 'WIN+EEE', 'Triumph effortlessly', 'win with e', 'WIN with E’s');
  NH('for instance', 'STA+4[blue]+NCE', 'For example', '', '4 inside STANCE');
  NH('trail mix', 'TLRIA RIALT ATRIL', 'A hiker’s snack', '', 'TRAIL, mixed up');
  NH('water', 'HIJKLMNO', 'You drink it', 'h2o', 'H to O');
  NH('red in the face', 'FA+RED[red]+CE', 'Embarrassed', '', 'RED inside FACE');
  NH('credibility gap', 'CREDIBILITY[split]', 'A lack of trust', '', 'A gap in CREDIBILITY');
  NH('too funny for words', 'FUNNY FUNNY\nWORDS WORDS WORDS WORDS', 'Hilarious beyond description', '', 'Two FUNNYs, four WORDS');
  NH('deep in thought', 'THO+DEEP[blue]+UGHT', 'Pondering', '', 'DEEP inside THOUGHT');
  NH('caught in the act', 'AC+CAUGHT[blue]+T', 'Red-handed', '', 'CAUGHT inside ACT');
  NH('too little too late', 'LITTLE LITTLE LATE LATE', 'Insufficient and tardy', 'too little, too late', 'Two LITTLEs, two LATEs');
  NH('a friend in need', 'NE+FRIEND[blue]+ED', '...is a friend indeed', 'friend in need', 'FRIEND inside NEED');
  NH('unfinished symphony', 'SYMPHON', 'Schubert left one of these', '', 'SYMPHONY, unfinished');
  NH('in between jobs', 'JOB IN JOB', 'Looking for work', 'between jobs', 'IN between JOBs');
  NH('missing you', 'ABCDEFGHIJKLM\nNOPQRSTVWXYZ', 'Wish you were here', 'i miss you,miss you,missing u', 'The alphabet, missing U');
  NH('space invaders', 'VA~~~DERS', 'Classic arcade game', '', 'A space in INVADERS');
  NH('iron curtain', 'IR\nCURTAIN', 'Cold War divide', 'the iron curtain', 'IR on CURTAIN');
  NH('circles under the eyes', '@eye @eye\nO O', 'Sign of no sleep', 'circles under your eyes,dark circles,circles under eyes', 'Circles under the EYES');
  NH('split pea soup', 'SO+@pea+UP', 'A hearty green bowl', 'pea soup', 'PEA splitting SOUP');
  NH('what goes up must come down', 'WHAT GOES[vup] MUST COME[vert]', 'Gravity always wins', '', 'GOES up, COME down');
  NH('you are in trouble', 'TROU+UR[red]+BLE', 'Uh-oh!', "you're in trouble,u r in trouble", 'U R inside TROUBLE');
  NH('working overtime', 'WORKING\n---\nTIME', 'Late at the office', 'work overtime', 'WORKING over TIME');
  NH('wish upon a star', 'WISH\n@star', 'A nighttime ritual', 'when you wish upon a star', 'WISH upon a STAR');
  NH('back to square one', 'KCAB 2 ONE[box]', 'Start all over', 'back to square 1', 'BACK 2 ONE in a square');
  NH('lost in translation', 'TRANS+LOST[blue]+LATION', 'The meaning gets muddled', '', 'LOST inside TRANSLATION');
  NH('love is in the air', 'AI+@heart+R', 'Romance all around', '', 'LOVE inside AIR');
  NH('you mean the world to me', 'WOR+YOU[xs]+LD', 'A heartfelt declaration', 'you are my world', 'YOU inside WORLD');
  NH('foot in mouth', 'MOU+@foot+TH', 'Said the wrong thing', 'put your foot in your mouth,foot in your mouth,foot in my mouth', 'FOOT inside MOUTH');
  NH('egg on your face', '@egg\nFACE', 'Embarrassed after a blunder', 'egg on face,egg on my face', 'EGG on FACE');
  NH('rain on my parade', '@rain\nPARADE', 'Spoil the fun', 'rain on your parade,rain on the parade', 'RAIN on PARADE');
  NH('eye of the storm', 'STO+@eye+RM', 'The calm center', '', 'EYE in the middle of STORM');
  NH('keep an eye on it', '@eye\nIT', 'Watch it closely', 'eye on it,keep your eye on it', 'EYE on IT');
  NH('star-crossed lovers', '@star LOVERS[cross]', 'Romeo and Juliet', 'star crossed lovers,star-crossed', 'STAR + LOVERS, crossed');
  NH('light at the end of the tunnel', 'TUNNEL+@bulb', 'Hope at last', '', 'LIGHT at the end of TUNNEL');
  NH('sunny side up', '@sun+NY SIDE[vup]', 'An egg style', 'sunny-side up', 'SUN-NY + SIDE going up');
  NH('everything under the sun', '@sun\n---\nEVERYTHING', 'Absolutely all of it', '', 'EVERYTHING under the SUN');
  NH('over the moon', 'ME\n---\n@moon', 'Delighted', '', 'ME over the MOON');
  NH('king of the hill', '@crown\nHILL', 'Top of the heap', '', 'A KING on top of the HILL');
  NH('barking up the wrong tree', '@dog @tree[flip]', 'Mistaken target', 'barking up wrong tree', 'DOG + the wrong-way-up TREE');
  NH('walking on eggshells', 'WALKING\n@egg @egg @egg', 'Treading carefully', 'walk on eggshells,walking on eggs', 'WALKING on EGGS');
  NH('fly on the wall', '@fly\nWALL', 'An unseen observer', 'a fly on the wall', 'FLY on WALL');
  NH('ear to the ground', '@ear 2 GROUND', 'Alert to rumors', 'keep your ear to the ground,ear to ground', 'EAR 2 GROUND');
  NH('shrinking violet', 'VIOLET[shrink,purple]', 'A very shy person', '', 'VIOLET, shrinking');

  /* ---------------------------------------------------------------
     7. DIFFICULTY TUNING
     Picture sums that spell their answer outright and texting-style
     abbreviations are too easy, so they're dropped. The gentler
     sound-it-out puns move from Tricky down to Warm-up.
     --------------------------------------------------------------- */
  const REMOVE = new Set([
    'starfish', 'keyhole', 'sunglasses', 'football', 'bookworm', 'catfish', 'earthworm', 'snail mail',
    'doghouse', 'pancake', 'sunflower', 'cupcake', 'heartbeat', 'eyeball', 'sweet tooth', 'butterfingers',
    'doorbell', 'doorman', 'manhole', 'treehouse', 'birdhouse', 'keyboard', 'fireplace', 'campfire',
    'fireman', 'mailman', 'chairman', 'wheelchair', 'toothpaste', 'toothpick', 'notebook', 'stopwatch',
    'earthquake', 'bedroom', 'flowerbed', 'eggshell', 'shoelace', 'email', 'cupboard', 'Sunday',
    'boathouse', 'lifeboat', 'raindrop', 'pie chart', 'clockwise', 'sawdust', 'booklet', 'apple pie',
    'honeybee', 'catwalk', 'rain check', 'sunroof', 'eyeliner', 'dog bowl',
    'before', 'today', 'tonight', 'later', 'great', 'I owe you', 'easy', 'see you later',
    'someone', 'anyone', 'everyone', 'no one',
  ]);
  const TO_EASY = new Set([
    'eyesore', 'candy', 'pelican', 'pants', 'plant', 'giant', 'earring', 'heart', 'early', 'spring',
    'belly', 'barbell', 'carpet', 'cartoon', 'carrot', 'scar', 'elbow', 'bowl', 'trombone', 'peanut',
    'peacock', 'peace', 'magpie', 'pearl', 'ballet', 'sparrow', 'narrow', 'panda', 'Japan', 'panic',
    'what', 'chat', 'hatch', 'brain', 'train', 'monkey', 'donkey', 'turkey', 'diet', 'catalog', 'mango',
    'birdie', 'starling', 'beetroot', 'manager', 'wok', 'candle', 'pillage', 'antelope',
    'toucan', 'tulip', 'forecast', 'forehead', 'fortune', 'forbid', 'skate', 'wait', 'plate', 'often',
    'tennis', 'kitten', 'mitten', 'attention', 'written', 'wonderful', 'excel', 'excellent', 'energy',
    'icy', 'empty', 'cutie', 'decay', 'essay', 'excess', 'exit', 'expert', 'tea for two', 'barbecue',
    'seashell', 'seasick', 'seagull', 'teapot', 'I see you', 'tepee', 'ivy', 'deviate', 'together',
    'tomorrow', 'believe', 'belief', 'be careful', 'seesaw', 'season', 'seal', 'canteen', 'beacon',
    'canine', 'canoe', 'parrot', 'daisy', 'forest', 'ideal', 'icicle', 'rebate', 'tender', 'spy',
  ]);
  pools.easy = pools.easy.filter(p => !REMOVE.has(p.a));
  const moved = pools.medium.filter(p => TO_EASY.has(p.a));
  pools.medium = pools.medium.filter(p => !TO_EASY.has(p.a) && !REMOVE.has(p.a));
  pools.easy.push(...moved);
  [...REMOVE, ...TO_EASY].forEach(a => {
    if (!Object.values(pools).flat().some(p => p.a === a) && !REMOVE.has(a)) console.warn('[Rebusday] tuning: unknown answer', a);
  });

  /* ---------------------------------------------------------------
     8. BATCH 2  (November 2026: original layouts of common phrases)
     Everything above is batch 1. New puzzles are queued AFTER the
     batch-1 schedule, so adding them never changes a past or current
     day. To add more later: call mark() again, then add the new batch.
     --------------------------------------------------------------- */
  const marks = { easy: [], medium: [], hard: [] };
  const mark = () => Object.keys(pools).forEach(t => marks[t].push(pools[t].length));
  const have = new Set(Object.values(pools).flat().map(p => p.a.toLowerCase()));
  const B = (tier) => (a, g, h, alt, why) => {
    if (have.has(a.toLowerCase())) return;
    have.add(a.toLowerCase());
    add(tier, a, g, h, alt, why);
  };

  /* Batch-1 puzzles that read straight off the page (e.g. "4GET IT") are
     swapped in place for better ones, so the schedule doesn't shift. */
  const swap = (tier, old, a, g, h, alt, why) => {
    const i = pools[tier].findIndex(p => p.a === old);
    if (i < 0) return console.warn('[Rebusday] swap: not found', old);
    pools[tier][i] = { a, g, h, alt: alt ? alt.split(',').map(x => x.trim()).filter(Boolean) : [], why: why || '' };
  };
  swap('medium', 'forgive and forget', 'cold feet', '@foot[blue] @foot[blue]', 'Last-minute nerves', 'cold foot', 'Blue (cold) FEET');
  swap('medium', 'word for word', 'blue in the face', 'FA+BLUE[blue]+CE', 'Argued until...', '', 'BLUE inside FACE');
  swap('medium', 'to be or not to be', 'the long and short of it', 'IT[long] IT[xs]', 'In a nutshell', 'long and short of it', 'A long IT and a short IT');
  swap('medium', 'forget it', 'split hairs', 'HAIRS[split]', 'Argue over tiny details', 'splitting hairs', 'HAIRS, split');
  swap('medium', 'potatoes', 'cross-section', 'SECTION[cross]', 'A slice through the middle', 'cross section', 'SECTION, crossed');
  swap('medium', 'comfortable', 'fat chance', 'CHANCE[bold,xl]', 'Not likely!', '', 'A fat CHANCE');
  swap('medium', 'fortunate', 'rising tide', 'TIDE[rise]', '...lifts all boats', 'a rising tide', 'TIDE, rising');
  swap('medium', 'forage', 'sinking feeling', 'FEELING[fall]', 'Dread creeping in', '', 'FEELING, sinking');
  swap('medium', 'exercise', 'cover up', 'COVER[vup]', 'Hide the evidence', 'cover-up,coverup', 'COVER reading up');
  swap('medium', 'foreground', 'feet on the ground', '@foot @foot\nGROUND', 'Down to earth', 'keep your feet on the ground,both feet on the ground', 'FEET on GROUND');
  swap('medium', 'go for it', 'go overboard', 'GO\n---\nBOARD', 'Way too much', 'gone overboard,going overboard', 'GO over BOARD');
  swap('medium', 'face to face', 'face to face', 'FACE FACE[mirror]', 'In person', 'face-to-face', 'Two FACEs facing each other');
  swap('medium', 'over and over', 'growing old', 'OLD[grow]', 'Getting on a bit', 'grow old,growing older', 'OLD, growing');
  swap('medium', 'easy come easy go', 'ripple effect', 'EFFECT[wave]', 'One thing leads to another', '', 'EFFECT in ripples');
  swap('hard', 'too little too late', 'a house divided', 'HOUSE[split]', '...cannot stand', 'house divided,a house divided against itself', 'HOUSE, divided');

  mark();


  /* ---------------------------------------------------------------
     9. ANIMATED  (the motion is the clue). These are promoted into
     upcoming batch-1 days so they turn up soon; the puzzles they
     replace move to the end of batch 2, so no day already played
     changes.
     ANIMATIONS (one per piece): shake spin bounce leap blink wink pop
     beat swing rock drive zoom fly crawl buzz sink rising drop drift
     squeeze squish pushr pushl press roll
     --------------------------------------------------------------- */
  const displaced = [];
  const promote = (tier, old, a, g, h, alt, why) => {
    const i = pools[tier].findIndex(p => p.a === old);
    if (i < 0 || have.has(a.toLowerCase())) return console.warn('[Rebusday] promote skipped', old, a);
    displaced.push([tier, pools[tier][i]]);
    pools[tier][i] = { a, g, h, alt: alt ? alt.split(',').map(x => x.trim()).filter(Boolean) : [], why: why || '' };
    have.add(a.toLowerCase());
  };
  window.__REBUS_PROMOTE__ = promote;

  // Tricky
  promote('medium', 'think big', 'rock the boat', '@boat[rock,xl]', 'Cause trouble', 'rocking the boat', 'The BOAT is rocking');
  promote('medium', 'backward glance', 'mood swings', 'MOOD[swing]', 'Up one minute, down the next', 'mood swing', 'MOOD, swinging');
  promote('medium', 'tickled pink', 'jump for joy', 'JOY[bounce]', 'Absolutely delighted', 'jumping for joy', 'JOY, jumping');
  promote('medium', 'dialogue', 'spin doctor', 'DOCTOR[spin]', 'Political PR fixer', 'spin doctors', 'DOCTOR, spinning');
  promote('medium', 'no idea', 'on and off', 'ON[blink]', 'Now and again', 'off and on,on-off,on off', 'ON, flicking on and off');
  promote('medium', 'all in one', 'fast forward', 'FORWARD[zoom]', 'Skip ahead', 'fast-forward', 'FORWARD, moving fast');
  promote('medium', 'cut short', 'car chase', '@car[drive] @car[drive]', 'Action-film staple', 'car chases', 'One CAR chasing another');
  promote('medium', 'reindeer', 'sinking ship', '@boat[sink,xl]', 'Abandon it!', 'a sinking ship', 'The BOAT is sinking');
  promote('medium', 'small fortune', 'rising sun', '@sun[rising,xl]', 'Dawn breaking', 'the rising sun,sunrise', 'The SUN is rising');
  promote('medium', 'microwave', 'turning point', 'POINT[spin]', 'The moment everything changed', '', 'POINT, turning');
  promote('medium', 'pucker up', 'busy as a bee', '@bee[buzz,lg]', 'Rushed off your feet', 'busy bee,as busy as a bee', 'A BEE, busy buzzing');
  promote('medium', 'rising prices', 'heart racing', '@heart[beat,xl]', 'Nervous excitement', 'racing heart,heart pounding,pounding heart,heart beating fast', 'HEART, racing');
  promote('medium', 'tennis shoes', 'pop the question', '?[pop,xl]', 'Get down on one knee', 'popping the question', 'A QUESTION mark, popping');
  promote('medium', 'square deal', 'drift off', 'OFF[drift]', 'Fall asleep', 'drifting off,drift off to sleep', 'OFF, drifting');
  promote('medium', 'houseplant', 'shaky start', 'START[shake]', 'Not the best beginning', 'a shaky start,shaky beginning', 'START, shaking');
  promote('medium', 'big bad wolf', "at a snail's pace", '@snail[crawl]', 'Painfully slow', "snail's pace,snails pace,at a snails pace", 'A SNAIL, crawling along');
  promote('medium', 'coffee break', 'in full swing', 'FULL[swing]', 'Well under way', 'full swing', 'FULL, swinging');
  promote('medium', 'sealant', 'head spinning', 'HEAD[spin]', 'Too much to take in', 'my head is spinning,head is spinning,spinning head', 'HEAD, spinning');
  promote('medium', 'alpine', 'bounce back', 'BACK[bounce]', 'Recover quickly', 'bounced back,bouncing back', 'BACK, bouncing');
  promote('medium', 'polite', 'free as a bird', '@bird[fly]', 'No ties, no worries', 'free bird,as free as a bird', 'A BIRD, flying free');
  promote('medium', 'bell-bottoms', 'in a flash', '@bolt[blink,xl]', 'Very quickly', 'like a flash,quick as a flash', 'A FLASH of lightning');
  promote('medium', 'falling in love', 'shake it off', 'IT[shake]', 'Don’t let it get to you', 'shake it out', 'IT, shaking');
  promote('medium', 'eggs over easy', 'sunset', '@sun[sink,xl]', 'End of the day', 'setting sun,sundown,the sun goes down', 'The SUN is setting');

  // Brain-bender
  promote('hard', 'a friend in need', 'between a rock and a hard place', 'ROCK[pushr] @man[squeeze,xl] HARD~PLACE[pushl]', 'Stuck with two bad options', 'between a rock and hard place,rock and a hard place', 'A man squeezed between ROCK and HARD PLACE');
  promote('hard', 'try to understand', 'chasing your tail', '@dog[spin,xl]', 'Busy getting nowhere', 'chasing its tail,chase your tail,chasing my tail', 'A DOG going round and round');
  promote('hard', "he's beside himself", 'dropping like flies', '@fly[drop] @fly[drop] @fly[drop]', 'Going down one after another', 'drop like flies,dropped like flies', 'FLIES, dropping');
  promote('hard', 'big fish in a small pond', 'keep the ball rolling', '@ball[roll]', 'Keep things moving', 'get the ball rolling,ball rolling,keep the ball moving', 'A BALL, rolling');
  promote('hard', 'keep your eyes on the ball', 'under pressure', 'PRESSURE[press]\n@man[squish,xl]', 'Stressed and squeezed', 'under a lot of pressure', 'A man under PRESSURE');
  promote('hard', 'back in a minute', "now you see it now you don't", 'IT[blink]', 'Magician’s patter', "now you see it,now you see it, now you don't,now you see it now you dont", 'IT, appearing and vanishing');
  promote('hard', 'iron curtain', 'in the blink of an eye', '@eye[wink,xl]', 'Instantly', 'blink of an eye,in a blink', 'An EYE, blinking');
  promote('hard', 'once upon a time', 'leap of faith', 'FAITH[leap]', 'Trust without proof', 'a leap of faith', 'FAITH, leaping');
  promote('hard', 'safety in numbers', 'quaking in your boots', '@shoe[shake] @shoe[shake]', 'Terrified', 'shaking in your boots,quaking in my boots,shaking in my boots', 'BOOTS, quaking');
  promote('hard', 'in between jobs', 'fly-by-night', '@moon @fly[drive]', 'Dodgy and short-lived', 'fly by night,fly-by-night operation', 'A FLY going BY the moon at NIGHT');
  promote('hard', 'time to reflect', 'slowly but surely', 'SURELY[crawl]', 'Getting there in the end', 'slow but sure', 'SURELY, creeping along');
  promote('hard', 'Peking duck', 'jumping to conclusions', 'CONCLUSIONS[leap]', 'Assuming too fast', 'jump to conclusions,jumped to conclusions', 'CONCLUSIONS, jumping');

  // Starter: add up the pictures
  const E2 = B('easy');
  E2('catfish', '@cat @fish', 'Whiskered river dweller', 'cat fish', 'CAT + FISH');
  E2('starfish', '@star @fish', 'Five-armed rock-pool find', 'star fish', 'STAR + FISH');
  E2('sunglasses', '@sun @glasses', 'Shades', 'sun glasses', 'SUN + GLASSES');
  E2('lighthouse', '@bulb @house', 'Warns ships off the rocks', 'light house', 'LIGHT + HOUSE');
  E2('moonwalk', '@moon WALK', 'Gliding backwards dance move', 'moon walk', 'MOON + WALK');
  E2('honeymoon', '@honey @moon', 'Trip after the wedding', 'honey moon', 'HONEY + MOON');
  E2('buttercup', '@butter @cup', 'Little yellow wildflower', 'butter cup', 'BUTTER + CUP');
  E2('pineapple', 'PINE @apple', 'Spiky tropical fruit', 'pine apple', 'PINE + APPLE');
  E2('keyhole', '@key @hole', 'Peek through it', 'key hole', 'KEY + HOLE');
  E2('firefly', '@fire @fly', 'Glows on summer nights', 'fire fly', 'FIRE + FLY');
  E2('earthworm', '@earth @worm', 'Gardener’s friend', 'earth worm', 'EARTH + WORM');
  E2('stepladder', 'STEP @ladder', 'For reaching the top shelf', 'step ladder', 'STEP + LADDER');
  E2('bedrock', '@bed ROCK', 'Solid foundation', 'bed rock', 'BED + ROCK');
  E2('footnote', '@foot @note', 'Small print at the bottom of a page', 'foot note', 'FOOT + NOTE');
  E2('watchdog', '@watch @dog', 'Guards the house (or the public)', 'watch dog', 'WATCH + DOG');
  E2('sweetheart', '@candy @heart', 'Darling', 'sweet heart', 'SWEET + HEART');
  E2('bow tie', '@bow @tie', 'Formal neckwear', 'bowtie', 'BOW + TIE');
  E2('rainbow', '@rain @bow', 'After the storm', 'rain bow', 'RAIN + BOW');
  E2('football', '@foot @ball', 'The beautiful game', 'foot ball', 'FOOT + BALL');
  E2('mailbox', '@mail[box]', 'Where letters land', 'mail box,postbox', 'MAIL in a box');
  E2('pinball', 'PIN @ball', 'Flippers and bumpers', 'pin ball', 'PIN + BALL');
  E2('fireball', '@fire @ball', 'Blazing sphere', 'fire ball', 'FIRE + BALL');
  E2('balloon', '@ball+OON', 'Party decoration', 'balloons', 'BALL + OON');
  E2('bookworm', '@book @worm', 'Always reading', 'book worm', 'BOOK + WORM');
  E2('snail mail', '@snail @mail', 'Letters, the slow way', 'snailmail', 'SNAIL + MAIL');
  E2('carpool', '@car POOL', 'Share the ride', 'car pool', 'CAR + POOL');
  E2('housefly', '@house @fly', 'Buzzes round the kitchen', 'house fly', 'HOUSE + FLY');
  E2('eggcup', '@egg @cup', 'Holds your boiled breakfast', 'egg cup', 'EGG + CUP');
  E2('bluebell', '@bell[blue]', 'Woodland spring flower', 'blue bell', 'A blue BELL');
  E2('bluebird', '@bird[blue]', 'Songbird of happiness', 'blue bird', 'A blue BIRD');
  E2('goldfish', 'FISH[gold]', 'Three-second memory pet', 'gold fish', 'FISH in gold');
  E2('greenhouse', '@house[green]', 'Where tomatoes grow', 'green house', 'A green HOUSE');
  E2('the White House', 'HOUSE[white]', '1600 Pennsylvania Avenue', 'white house', 'HOUSE in white');
  E2('lightbulb', '@bulb', 'Moment of inspiration', 'light bulb,bulb', 'A light BULB');
  E2('eyeball', '@eye @ball', 'Look at closely', 'eye ball', 'EYE + BALL');

  // Tricky
  const M2 = B('medium');
  M2('red herring', '@fish[red]', 'A misleading clue', '', 'A red FISH');
  M2('red alert', 'ALERT[red]', 'Danger!', '', 'ALERT in red');
  M2('red carpet', 'CARPET[red]', 'Premiere walkway', '', 'CARPET in red');
  M2('blue moon', '@moon[blue]', 'Rare as one', '', 'A blue MOON');
  M2('green light', '@bulb[green]', 'Permission to go', 'greenlight', 'A green LIGHT');
  M2('pink slip', 'SLIP[pink]', 'Notice of dismissal', '', 'SLIP in pink');
  M2('golden rule', 'RULE[gold]', 'Treat others as you’d like to be treated', 'the golden rule,gold rule', 'RULE in gold');
  M2('grey area', 'AREA[gray]', 'Neither right nor wrong', 'gray area', 'AREA in grey');
  M2('purple patch', 'PATCH[purple]', 'A run of good form', '', 'PATCH in purple');
  M2('square meal', 'MEAL[box]', 'A proper dinner', '', 'MEAL in a square');
  M2('box office', 'OFFICE[box]', 'Where you buy tickets', 'box-office', 'OFFICE in a box');
  M2('square root', 'ROOT[box]', 'Maths: what times itself makes this?', '', 'ROOT in a square');
  M2('boxed in', 'IN[box]', 'Trapped', 'boxed-in', 'IN, boxed');
  M2('inner circle', 'IN[circle]', 'Your most trusted few', '', 'IN, circled');
  M2('come full circle', 'COME[circle]', 'End up where you started', 'full circle', 'COME in a full circle');
  M2('ring road', 'ROAD[ring]', 'Goes round the city', 'ringroad,orbital road', 'ROAD in a ring');
  M2('ring of fire', 'FIRE[ring]', 'Volcanic zone round the Pacific', 'circle of fire', 'FIRE in a ring');
  M2('broken promise', 'PROMISE[scatter]', 'Let down', 'broken promises', 'PROMISE, broken');
  M2('broken record', 'RECORD[scatter]', 'Saying the same thing again', '', 'RECORD, broken');
  M2('break the ice', 'ICE[scatter]', 'Start the conversation', 'breaking the ice,icebreaker', 'ICE, broken');
  M2('turn the tables', 'TABLES[flip]', 'Reverse the situation', 'tables turned,turning the tables', 'TABLES, turned over');
  M2('upside down', 'DOWN[flip]', 'The wrong way up', 'upside-down', 'DOWN, upside down');
  M2('upset stomach', 'STOMACH[flip]', 'Tummy trouble', 'upset tummy', 'STOMACH, upset');
  M2('mixed feelings', 'FLEESNIG', 'Not sure how you feel', '', 'FEELINGS, mixed up');
  M2('double check', 'CHECK CHECK', 'Make sure, then make sure again', 'double-check,doublecheck', 'CHECK, doubled');
  M2('double take', 'TAKE[double]', 'Look again in surprise', 'do a double take', 'TAKE, doubled');
  M2('double-cross', 'CROSS[double]', 'Betray', 'double cross,doublecross', 'CROSS, doubled');
  M2('falling star', 'STAR[fall]', 'Make a wish!', 'shooting star', 'STAR, falling');
  M2('rising star', 'STAR[rise]', 'Up-and-coming talent', '', 'STAR, rising');
  M2('drop the ball', 'BALL[fall]', 'Mess up a responsibility', 'dropped the ball', 'BALL, dropped');
  M2('fall flat', 'FLAT[fall]', 'Fail to impress', 'fell flat', 'FLAT, falling');
  M2('falling apart', 'APART[fall]', 'Coming to pieces', 'fall apart,fell apart', 'APART, falling');
  M2('raise the roof', 'ROOF[rise]', 'Party loudly', '', 'ROOF, rising');
  M2('heatwave', 'HEAT[wave]', 'Scorching week', 'heat wave', 'HEAT in a wave');
  M2('ringtone', 'TONE[ring]', 'Your phone’s tune', 'ring tone', 'TONE in a ring');
  M2('let down', 'LET[vert]', 'Disappoint', 'letdown,let-down', 'LET reading down');
  M2('calm down', 'CALM[vert]', 'Take a breath', '', 'CALM reading down');
  M2('hands down', 'HANDS[vert]', 'Easily, no contest', '', 'HANDS reading down');
  M2('step up', 'STEP[vup]', 'Rise to the challenge', 'step-up', 'STEP reading up');
  M2('tied up', 'TIED[vup]', 'Busy at the moment', '', 'TIED reading up');
  M2('line up', 'LINE[vup]', 'Form a queue', 'lineup,line-up', 'LINE reading up');
  M2('butter up', 'BUTTER[vup]', 'Flatter someone', '', 'BUTTER reading up');
  M2('lie down', 'LIE[side]', 'Have a rest', '', 'LIE, lying on its side');
  M2('side effects', 'EFFECTS[side]', 'Read the leaflet', 'side effect', 'EFFECTS on its side');
  M2('sidekick', 'KICK[side]', 'Loyal helper', 'side kick', 'KICK on its side');
  M2('sideways glance', 'GLANCE[side]', 'A sneaky look', 'sideways look,side glance', 'GLANCE, sideways');
  M2('off balance', 'BALANCE[tilt]', 'Wobbling', 'off-balance', 'BALANCE, tilting');
  M2('stand tall', 'STAND[tall]', 'Be proud', '', 'STAND, tall');
  M2('tall tale', 'TALE[tall]', 'Hard to believe', 'tall story', 'TALE, tall');
  M2('stretch the truth', 'TRUTH[long]', 'Exaggerate', 'stretching the truth', 'TRUTH, stretched');
  M2('long weekend', 'WEEKEND[long]', 'Bank holiday bonus', '', 'WEEKEND, long');
  M2('long shot', 'SHOT[long]', 'Unlikely to work', '', 'SHOT, long');
  M2('flat tyre', 'TYRE[squash]', 'Call the breakdown service', 'flat tire,flat', 'TYRE, flat');
  M2('growing concern', 'CONCERN[grow]', 'Worry that keeps getting bigger', '', 'CONCERN, growing');
  M2('small print', 'PRINT[xs]', 'Read it before you sign', 'the small print,fine print', 'PRINT, small');
  M2('big brother', 'BROTHER[xl]', 'Older sibling (or watching you)', '', 'BROTHER, big');
  M2('little sister', 'SISTER[xs]', 'Younger sibling', '', 'SISTER, little');
  M2('a big ask', 'ASK[xl]', 'Quite the favour', 'big ask', 'ASK, big');
  M2('big shot', 'SHOT[xl]', 'Important person', 'bigshot', 'SHOT, big');
  M2('shortcut', 'CUT[sm]', 'Quicker way', 'short cut', 'CUT, short');
  M2('high five', '5\n.\n.\n---', 'Slap hands!', 'high 5', '5 up high');
  M2('high hopes', 'HOPES\n.\n.\n---', 'Optimistic', '', 'HOPES up high');
  M2('highlight', '@bulb\n.\n.\n---', 'Best bit', 'highlights', 'LIGHT up high');
  M2('high and dry', 'DRY\n.\n.\n---', 'Left stranded', '', 'DRY up high');
  M2('low-key', '.\n.\n@key\n---', 'Understated', 'low key,lowkey', 'KEY down low');
  M2('low profile', '.\n.\nPROFILE\n---', 'Staying out of sight', 'keep a low profile', 'PROFILE down low');
  M2('top ten', '10\n.\n.\n.', 'Chart countdown', 'top 10', '10 at the top');
  M2('top hat', '@hat\n.\n.\n.', 'Magician’s headwear', 'tophat', 'HAT at the top');
  M2('online', 'ON\n---', 'Connected to the internet', 'on line', 'ON a line');
  M2('beeline', '@bee\n---', 'Straight there', 'bee line,make a beeline', 'BEE + LINE');
  M2('wide awake', 'AWAKE[wide]', 'Not sleepy at all', '', 'AWAKE, wide');
  M2('world wide web', 'WORLD[wide] WEB', 'www', 'worldwide web,www', 'WORLD (wide) + WEB');
  M2('thin air', 'AIR[thin]', 'Vanished into...', 'into thin air,out of thin air', 'AIR, thin');
  M2('paper-thin', 'PAPER[thin]', 'Very slim', 'paper thin', 'PAPER, thin');
  M2('bold move', 'MOVE[bold]', 'Daring decision', '', 'MOVE in bold');
  M2('fade away', 'AWAY[fade]', 'Slowly disappear', 'fading away', 'AWAY, fading');
  M2('fading memory', 'MEMORY[fade]', 'Hard to recall', 'faded memory', 'MEMORY, fading');
  M2('out of focus', 'FOCUS[blur]', 'Blurry photo', 'unfocused', 'FOCUS, blurred');
  M2('strike out', 'OUT[strike]', 'Fail at the plate', 'struck out,strikeout', 'OUT, struck through');
  M2('no comment', 'COMMENT[strike]', 'Says the spokesperson', '', 'COMMENT crossed out');
  M2('cancelled flight', 'FLIGHT[strike]', 'Bad news at the airport', 'canceled flight,flight cancelled', 'FLIGHT crossed out');
  M2('outline', 'LINE[outline]', 'Rough sketch of a plan', 'out line', 'LINE in outline');
  M2('back to front', 'FRONT[rev]', 'Wrong way round', '', 'FRONT, backward');
  M2('backseat driver', 'SEAT[rev] DRIVER', 'Annoying passenger', 'back seat driver', 'SEAT backward + DRIVER');
  M2('time flies', 'TIME @fly', 'When you’re having fun', '', 'TIME + FLY');
  M2('excuse me', 'XQZ ME', 'Pardon', '', 'X-Q-Z (excuse) ME');
  M2('Ireland', '@eye+R LAND', 'Emerald Isle', '', 'EYE-R + LAND');
  M2('Iceland', '@eye+C LAND', 'Land of fire and ice', '', 'EYE-C + LAND');
  M2('Holland', '@hole LAND', 'Land of tulips and windmills', 'the netherlands', 'HOLE + LAND');
  M2('island', '@eye LAND', 'Surrounded by water', '', 'EYE + LAND');
  M2('idol', '@eye DOLL', 'Adored celebrity', '', 'EYE + DOLL');
  M2('icon', '@eye CON', 'Little picture on your phone', '', 'EYE + CON');
  M2('excite', 'X+@eye+T', 'Thrill', '', 'X-EYE-T');
  M2('tutu', '2 2', 'Ballet skirt', '', 'Two 2s');
  M2('envelope', 'N V LOPE', 'Lick it, seal it', '', 'N-V + LOPE');
  M2('cucumber', 'Q CUMBER', 'Cool as one', '', 'Q + CUMBER');
  M2('queue', 'Q', 'A very British pastime', 'cue', 'Q');
  M2('beard', '@bee @ear+D', 'Grows on the chin', '', 'BEE + EAR-D');
  M2('bean', '@bee N', 'Baked in a tin', 'beans', 'BEE + N');
  M2('year', 'Y+@ear', '365 days', '', 'Y + EAR');
  M2('clear', 'CL+@ear', 'Transparent', '', 'CL + EAR');
  M2('learn', 'L+@ear+N', 'Study', '', 'L + EAR + N');
  M2('tearful', 'T+@ear FUL', 'On the verge of crying', '', 'T-EAR + FUL');
  M2('teardrop', 'T+@ear @drop', 'Rolls down a cheek', 'tear drop', 'T-EAR + DROP');
  M2('earworm', '@ear @worm', 'Song stuck in your head', 'ear worm', 'EAR + WORM');
  M2('cancel', '@can CEL', 'Call it off', '', 'CAN + CEL');
  M2('Canada', '@can+ADA', 'Maple leaf country', '', 'CAN + ADA');
  M2('Paris', '@pear IS', 'City of light', '', 'PEAR + IS');
  M2('repair', 'RE @pear', 'Fix it', '', 'RE + PEAR');
  M2('despair', 'DES @pear', 'Utter hopelessness', '', 'DES + PEAR');
  M2('repeat', 'RE+@pea+T', 'Do it again', '', 'RE + PEA + T');
  M2('eye candy', '@eye @candy', 'Nice to look at', '', 'EYE + CANDY');
  M2('snake eyes', '@snake @eye @eye', 'Double one on the dice', '', 'SNAKE + EYES');
  M2('die-hard', '@die HARD', 'Fiercely loyal fan', 'die hard,diehard', 'DIE + HARD');
  M2('pillar', '@pill+AR', 'Column', '', 'PILL + AR');
  M2('elephant', 'L E F @ant', 'Never forgets', '', 'L-E-F + ANT');
  M2('wholesome', '@hole SUM', 'Good and healthy', '', 'HOLE + SUM');
  M2('mankind', '@man KIND', 'Humanity', '', 'MAN + KIND');
  M2('title', '@tie TLE', 'Name of a book', '', 'TIE + TLE');
  M2('string', 'ST+@ring', 'Kite line', '', 'ST + RING');
  M2('keynote', '@key @note', 'Main speech at a conference', 'key note', 'KEY + NOTE');
  M2('hat trick', '@hat TRICK', 'Three goals by one player', 'hat-trick,hattrick', 'HAT + TRICK');
  M2('bone dry', '@bone DRY', 'Not a drop of moisture', 'bone-dry', 'BONE + DRY');
  M2('ballot', '@ball+OT', 'Cast your vote', '', 'BALL + OT');
  M2('egghead', '@egg HEAD', 'Brainy type', 'egg head', 'EGG + HEAD');
  M2('brain drain', '@brain DRAIN', 'Talent moving abroad', '', 'BRAIN + DRAIN');
  M2('big-hearted', '@heart[xl]', 'Generous', 'big hearted,bighearted,big heart', 'A big HEART');
  M2('half-hearted', '@heart[half]', 'Without enthusiasm', 'half hearted,halfhearted', 'Half a HEART');
  M2('half-baked', 'BAKED[half]', 'Not thought through', 'half baked', 'Half of BAKED');
  M2('half-time', 'TIME[half]', 'Oranges in the dressing room', 'half time,halftime', 'Half of TIME');
  M2("bird's-eye view", '@bird @eye VIEW', 'Seen from above', "bird's eye view,birds eye view,birdseye view", 'BIRD + EYE + VIEW');
  M2('music to my ears', '@note 2 @ear @ear', 'Lovely news', 'music to your ears', 'NOTE (music) 2 EARS');
  M2('heart of gold', 'HEART[gold]', 'Kind through and through', 'golden heart', 'HEART in gold');
  M2('side by side', 'SIDE[side] SIDE[side]', 'Next to each other', '', 'SIDE by SIDE');
  M2('little by little', 'LITTLE[sm] LITTLE[xs]', 'Gradually', 'bit by bit', 'LITTLE, then LITTLE');
  M2('tunnel vision', 'TUN+VISION[blue]+NEL', 'Focused on one thing only', '', 'VISION inside TUNNEL');

  // Brain-bender
  const H2 = B('hard');
  H2('once in a lifetime', 'LIFE+ONCE[blue]+TIME', 'Never to be repeated', '', 'ONCE inside LIFETIME');
  H2('stuck in the middle', 'MID+STUCK[red]+DLE', 'Caught between two sides', 'stuck in the middle with you', 'STUCK in the MIDDLE');
  H2('stuck in traffic', 'TRAF+STUCK[red]+FIC', 'Gridlock', '', 'STUCK inside TRAFFIC');
  H2('the inside story', 'ST+INSIDE[blue]+ORY', 'What really happened', 'inside story', 'INSIDE inside STORY');
  H2('up in the air', 'A+UP[blue]+IR', 'Undecided', '', 'UP inside AIR');
  H2('down in the dumps', 'DU+DOWN[blue]+MPS', 'Feeling low', '', 'DOWN inside DUMPS');
  H2('once in a while', 'WH+1[blue]+ILE', 'Occasionally', 'every once in a while', '1 (once) inside WHILE');
  H2('in the same boat', 'SA+@boat+ME', 'Facing the same problem', 'same boat', 'BOAT in SAME');
  H2('snake in the grass', 'GR+@snake+ASS', 'A hidden traitor', '', 'SNAKE inside GRASS');
  H2('heart in your mouth', 'MOU+@heart+TH', 'Terrified', 'heart in my mouth,heart in mouth', 'HEART inside MOUTH');
  H2('the heart of the matter', 'MAT+@heart+TER', 'The core issue', 'heart of the matter', 'HEART at the centre of MATTER');
  H2('ace in the hole', 'HO+ACE[red]+LE', 'A hidden advantage', 'an ace in the hole', 'ACE inside HOLE');
  H2('one foot in the grave', '1 GR+@foot+AVE', 'Very old', 'foot in the grave', '1 FOOT inside GRAVE');
  H2('middle of the road', 'MID+ROAD[blue]+DLE', 'Moderate, unremarkable', 'middle-of-the-road', 'ROAD in the MIDDLE');
  H2('plenty of fish in the sea', 'SE+@fish+@fish+@fish+A', 'Said after a breakup', 'plenty more fish in the sea,fish in the sea,lots of fish in the sea', 'FISH inside SEA');
  H2('through the roof', 'RO+@arrow+OF', 'Sky-high', 'go through the roof', 'An arrow through ROOF');
  H2('heart on your sleeve', '@heart\nSLEEVE', 'Showing every feeling', 'wear your heart on your sleeve,heart on my sleeve', 'HEART on SLEEVE');
  H2('icing on the cake', 'ICING\n@cake', 'The finishing touch', 'the icing on the cake', 'ICING on CAKE');
  H2('walking on air', 'WALKING\nAIR', 'Elated', '', 'WALKING on AIR');
  H2('all eyes on me', '@eye @eye @eye\nME', 'Centre of attention', 'all eyes on you', 'All EYES on ME');
  H2('easy on the eyes', 'EZ\n@eye @eye', 'Good-looking', 'easy on the eye', 'EZ on the EYES');
  H2('on top of the world', '@man\n@earth', 'Elated', 'top of the world', 'MAN on top of the WORLD');
  H2('man on the moon', '@man\n@moon', 'Apollo 11, 1969', 'man in the moon', 'MAN on the MOON');
  H2('like a house on fire', '@fire\n@house', 'Getting on brilliantly', 'house on fire,get on like a house on fire,getting on like a house on fire', 'FIRE on HOUSE');
  H2("I'm over you", "I'M\n---\nU", 'Moved on from an ex', 'im over you,i am over you,over you', "I'M over U");
  H2('hand over fist', 'HAND\n---\nFIST', 'Making money fast', '', 'HAND over FIST');
  H2('head above water', 'HEAD\n---\nWATER', 'Just about coping', 'keep your head above water,keeping your head above water', 'HEAD above WATER');
  H2('head and shoulders above the rest', 'HEAD SHOULDERS\n---\nTHE REST', 'Far superior', 'head and shoulders above', 'HEAD & SHOULDERS above THE REST');
  H2('right under your nose', 'NOSE\n---\nRIGHT', 'Obvious but missed', 'under your nose,right under my nose', 'RIGHT under NOSE');
  H2('mirror mirror on the wall', 'MIRROR MIRROR\nWALL', 'Who’s the fairest of them all?', 'mirror mirror', 'MIRROR MIRROR on WALL');
  H2('let the cat out of the bag', 'BAG[box] @cat', 'Spill a secret', 'cat out of the bag', 'CAT out of the BAG');
  H2('let sleeping dogs lie', 'ZZZ\n@dog @dog', 'Leave well alone', 'sleeping dogs lie,sleeping dogs', 'Sleeping DOGS');
  H2('square peg in a round hole', 'PEG[box] HOLE[circle]', 'Doesn’t fit in', 'square peg round hole', 'Square PEG, round HOLE');
  H2('three square meals', 'MEAL[box] MEAL[box] MEAL[box]', 'Breakfast, lunch and dinner', 'three square meals a day,3 square meals', 'Three square MEALs');
  H2('fair and square', 'FAIR[box]', 'Honestly won', '', 'FAIR, squared');
  H2('circle of life', 'LIFE[circle]', 'Birth, growth, repeat', 'the circle of life', 'LIFE in a circle');
  H2('stand out from the crowd', 'CROWD CROWD STAND[red,lg] CROWD CROWD', 'Get noticed', 'stand out in a crowd,stand out', 'STAND stands out from CROWD');
  H2('odd one out', 'EVEN EVEN ODD[red] EVEN', 'Doesn’t belong', 'the odd one out', 'ODD is the one out');
  H2('break a leg', 'LEG[scatter]', 'Good luck on stage!', '', 'LEG, broken');
  H2('broken English', 'ENGLISH[scatter]', 'Struggling with the language', 'broken english', 'ENGLISH, broken');
  H2('change of heart', 'HAERT', 'A new opinion', '', 'HEART, changed');
  H2('all mixed up', 'LAL', 'Confused', 'all muddled up', 'ALL, mixed up');
  H2('mixed doubles', 'BLUDESO', 'Tennis pairs, men and women', '', 'DOUBLES, mixed');
  H2('a bad spell', 'SPEL', 'A run of bad luck', 'bad spell,bad spelling', 'SPELL, spelled badly');
  H2('too close for comfort', 'COMFORT[tight]', 'Uncomfortably near', '', 'COMFORT, squeezed too close');
  H2('spread too thin', 'THIN[wide,thin]', 'Overcommitted', 'spread thin,stretched thin,stretched too thin', 'THIN, spread wide');
  H2('through thick and thin', 'THROUGH[bold] THROUGH[thin]', 'Loyal no matter what', 'thick and thin', 'THROUGH thick and THROUGH thin');
  H2('shadow of a doubt', 'DOUBT[double]', 'Beyond any uncertainty', 'beyond a shadow of a doubt,beyond the shadow of a doubt', 'DOUBT with a shadow');
  H2('losing my mind', 'MIND[fade]', 'Going a bit mad', 'lose my mind,losing your mind', 'MIND, fading away');
  H2('diminishing returns', 'RETURNS[shrink]', 'Less and less payoff', 'law of diminishing returns', 'RETURNS, shrinking');
  H2('short and sweet', 'SWEET[sm]', 'Brief and pleasant', '', 'SWEET, short');
  H2('long story short', 'STORY[long] SHORT[xs]', 'To cut to the chase', 'to cut a long story short,make a long story short', 'Long STORY, short SHORT');
  H2('little white lie', 'LIE[white,sm]', 'A harmless fib', 'white lie', 'A little white LIE');
  H2('thinking out loud', 'THINKING[xl,bold]', 'Saying it as you think it', 'think out loud,thinking aloud', 'THINKING, loud');
  H2('backhanded compliment', 'HANDED[rev] COMPLIMENT', 'Praise with a sting', 'back handed compliment,backhanded compliments', 'HANDED backward + COMPLIMENT');
  H2('turn back the clock', 'CLOCK[rev]', 'Undo the years', 'turn the clock back,put the clock back', 'CLOCK, turned backward');
  H2('leaning tower of Pisa', 'TOWER[tilt] PISA', 'Italian landmark', 'the leaning tower of pisa,leaning tower', 'TOWER, leaning + PISA');
  H2('at sixes and sevens', '6 6 7 7', 'In total disarray', 'sixes and sevens', 'Sixes and sevens');
  H2('love you to the moon and back', '@heart U 2 @moon & KCAB', 'Bedtime declaration', 'i love you to the moon and back,to the moon and back', 'LOVE U 2 MOON & BACK (written backward)');
  H2('eyes bigger than your stomach', '@eye[xl] @eye[xl]\nSTOMACH[xs]', 'Ordered too much food', 'eyes are bigger than your stomach,eyes bigger than stomach', 'Big EYES, small STOMACH');
  H2('out of the frying pan into the fire', '@pan @fire', 'From bad to worse', 'frying pan into the fire,out of the frying pan', 'PAN, then FIRE');
  H2('at the drop of a hat', 'HAT[fall]', 'Instantly', 'drop of a hat', 'HAT, dropping');
  H2('watch this space', '@watch THIS ~~~~~[box]', 'More coming soon', '', 'WATCH THIS (empty) SPACE');
  H2('every cloud has a silver lining', '@cloud LINING[silver]', 'Look on the bright side', 'silver lining,every cloud', 'CLOUD + silver LINING');
  H2('a bolt from the blue', '@bolt[blue]', 'A total surprise', 'bolt from the blue,bolt out of the blue', 'A blue BOLT');
  H2('from the bottom of my heart', '.\n.\n.\n@heart', 'Sincerely', 'bottom of my heart', 'HEART at the bottom');
  H2('on the ball', 'ME\n@ball', 'Alert and quick', '', 'ME on the BALL');
  H2('man in the middle', 'MID+@man+DLE', 'Caught between two sides', 'piggy in the middle', 'MAN in the MIDDLE');
  H2('heads I win', 'HEAD+S @eye WIN', 'Coin toss call', 'heads i win tails you lose', 'HEADS + EYE + WIN');
  // Puzzles bumped by the animated set go to the back of batch 2.
  displaced.forEach(([t, pz]) => pools[t].push(pz));
  delete window.__REBUS_PROMOTE__;
  mark();
  window.REBUS_BATCHES = marks;

  /* sanity check: unique answers */
  const seen = new Set();
  Object.values(pools).flat().forEach(p => {
    const k = p.a.toLowerCase();
    if (seen.has(k)) console.warn('[Rebusday] duplicate answer:', p.a);
    seen.add(k);
  });

  window.REBUS_POOLS = pools;
})();
