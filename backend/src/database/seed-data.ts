/**
 * First-boot content, copied verbatim from the design comp (Whitaker Plumbing v2).
 * Pure data — no framework imports — so the rules tests can load it.
 */

export const SETTINGS_SEED = {
  businessName: 'Whitaker Plumbing',
  contactName: 'Asher Whitaker',
  phone: '+1 (602) 833-3185',
  email: 'asher.whitaker@gmail.com',
  addressLine1: '600 E Trade St',
  addressLine2: 'Charlotte, NC 28202',
  showAddress: false,
  tagline: 'Leak repairs, drain cleaning, pipe repairs and water heater services.',
  credentials: '',
  hours: '',
  emergencyInfo: '',
  followUpNote: '',
  about:
    'Whitaker Plumbing is a small plumbing business handling leak repairs, drain cleaning, pipe repairs and water heater services. You can reach the business directly by phone or email, or send a service request through this website.',
  privacyNotice:
    'The service request form collects your name, phone, email, service type, issue description, general location and preferred time. This information is used to respond to your request.',
  reviewNote: '',
  showContentFlags: true,
  mobileCallBar: true,
  requestsOpen: true,
};

export interface ServiceSeed {
  slug: string;
  title: string;
  short: string;
  long: string;
  signs: string[];
  imageLabel: string;
  imageAlt: string;
}

export const SERVICES_SEED: ServiceSeed[] = [
  {
    slug: 'leak',
    title: 'Leak Repairs',
    short: 'Dripping fixtures, damp cabinets, water stains, or a water meter that keeps moving when everything is off.',
    long: 'For water showing up where it shouldn’t: under a sink, around a toilet base, behind a wall or through a ceiling. Tell us where you see water and how long it has been happening.',
    signs: ['Water under sinks or around fixtures', 'Stains or soft spots on walls and ceilings', 'Higher water use without a clear cause'],
    imageLabel: 'photo · plumber examining a visible leak under a sink',
    imageAlt: 'Photo placeholder: a plumber examining a leak beneath a sink',
  },
  {
    slug: 'drain',
    title: 'Drain Cleaning',
    short: 'Slow sinks, standing water in tubs and showers, gurgling drains or clogs that keep coming back.',
    long: 'For drains that empty slowly, back up or keep clogging. Let us know which fixtures are affected and whether more than one drain is slow.',
    signs: ['Water draining slowly or backing up', 'Gurgling sounds from drains', 'Clogs that return after plunging'],
    imageLabel: 'photo · drain-cleaning equipment at a kitchen drain',
    imageAlt: 'Photo placeholder: drain-cleaning equipment in use at a kitchen drain',
  },
  {
    slug: 'pipe',
    title: 'Pipe Repairs',
    short: 'Cracked, corroded, noisy or damaged water supply and drain pipes.',
    long: 'For pipes that are visibly damaged, corroded, noisy or affecting water pressure. Photos aren’t required. A description of what you see or hear is enough to start.',
    signs: ['Visible corrosion, cracks or drips at joints', 'Banging or rattling when water runs', 'Low pressure at one or more fixtures'],
    imageLabel: 'photo · close-up of copper fittings and a pipe wrench',
    imageAlt: 'Photo placeholder: copper pipe fittings and a pipe wrench',
  },
  {
    slug: 'heater',
    title: 'Water Heater Services',
    short: 'No hot water, inconsistent temperature, unusual noises, or water around the tank.',
    long: 'For water heaters that stop producing hot water, run out quickly, make unusual noises or leak. If you know the heater type (tank or tankless, gas or electric), include it.',
    signs: ['No hot water, or it runs out quickly', 'Rumbling or popping from the tank', 'Water pooling near the heater'],
    imageLabel: 'photo · tank water heater inspected in a utility room',
    imageAlt: 'Photo placeholder: a tank water heater being inspected in a utility room',
  },
];

type Seed = { fields: Record<string, unknown> }[];
const f = (fields: Record<string, unknown>) => ({ fields });

export const CONTENT_SEED: Record<string, Seed> = {
  faq: [
    f({ q: 'Which plumbing services do you offer?', a: 'Requests can be made for leak repairs, drain cleaning, pipe repairs and water heater services. If your issue doesn’t fit one of these, choose “Other Plumbing Issue” and describe it.', home: 'yes' }),
    // Pending answers (empty) — shown as "Answer to be provided…" only while review flags are on.
    f({ q: 'Which locations do you serve?', a: '', home: 'yes' }),
    f({ q: 'How can I request service?', a: 'Call +1 (602) 833-3185 or use the service request form on this website. No account is needed.', home: 'yes' }),
    f({ q: 'What information should I provide?', a: 'Your name, phone and email, the type of service, a short description of the problem, your city or ZIP code, and a preferred time of day.', home: 'yes' }),
    f({ q: 'Can I request a preferred appointment time?', a: 'Yes. The form asks for a preferred date and time of day. Sending a request does not confirm an appointment.', home: 'no' }),
    f({ q: 'How will I know my request has been received?', a: 'A confirmation appears on screen once your request has been recorded.', home: 'no' }),
    f({ q: 'Do you provide emergency plumbing services?', a: '', home: 'no' }),
    f({ q: 'What are your business hours?', a: '', home: 'no' }),
  ],
  benefit: [
    f({ title: 'Describe it your way', body: 'The request form asks plain questions, so you can explain the problem without plumbing terminology.' }),
    f({ title: 'Call or send a request', body: 'Phone directly or submit a request online. No account needed.' }),
    f({ title: 'An organised request', body: 'Your issue, location and preferred time arrive together, so the follow-up conversation can start from the details.' }),
    f({ title: 'Clear service information', body: 'Each service lists common signs to help you choose, or pick “Other” and describe it.' }),
  ],
  assurance: [f({ text: 'Call or request online' }), f({ text: 'No account needed' }), f({ text: 'Choose a preferred time' })],
  step: [
    f({ title: 'Tell us about the issue', body: 'Choose a service type and describe what’s happening in your own words.' }),
    f({ title: 'Share your contact and general location', body: 'Your name, phone, email and city or ZIP code.' }),
    f({ title: 'Provide a preferred time', body: 'Pick a date if you have one and a time of day that suits you.' }),
    f({ title: 'Submit your request', body: 'You’ll see a confirmation once it’s recorded. This doesn’t book an appointment.' }),
  ],
  tip: [
    f({ text: 'Where the problem is (kitchen, bathroom, basement, outside)' }),
    f({ text: 'What you notice: water, noise, smell, slow drainage' }),
    f({ text: 'When it started and whether it’s getting worse' }),
    f({ text: 'Whether you own or rent the property' }),
  ],
  // The design ships APPROVED_AREAS = [] — nothing is seeded until the business approves a list.
  'service-area': [],
};
