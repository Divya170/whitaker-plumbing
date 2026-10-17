/**
 * Business-rule checks that run without a database or Nest:
 *   npm run test:validation
 * Covers the request form rules (design messages, E.164, references, honeypot), the
 * service-area lookup, CSRF token comparison, cookie parsing, service + content validation and seed data.
 */
import { strict as assert } from 'assert';
import { csvSafe, formatPhone, isHoneypot, publicRef, toE164, validateRequest } from './leads/request-validation';
import { validateService } from './services/service-validation';
import { validateContentFields } from './content/content.validation';
import { CONTENT_TYPE_MAP } from './content/content.schemas';
import { checkArea } from './content/area-lookup';
import { CONTENT_SEED, SERVICES_SEED } from './database/seed-data';
import { parseCookies, sameToken } from './common/cookies';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

const SERVICES = ['leak', 'drain', 'pipe', 'heater', 'other'];
const TODAY = '2026-10-13';
const good = {
  name: 'Maria Delgado', phone: '(704) 555-0142', email: 'Maria.D@Example.com', service: 'leak',
  issue: 'Water dripping from the ceiling below the upstairs bathroom.', location: '28203',
  preferredDate: '2026-10-20', preferredWindow: 'morning', extra: 'Dog at home.', company: '',
};
const errs = (p: object) => validateRequest({ ...good, ...p }, { services: SERVICES, today: TODAY }).errors;

test('a complete request passes and is normalised', () => {
  const { errors, value } = validateRequest(good, { services: SERVICES, today: TODAY });
  assert.deepEqual(errors, {});
  assert.equal(value.phoneE164, '+17045550142');
  assert.equal(value.email, 'maria.d@example.com');
  assert.equal(value.preferredDate, '2026-10-20');
  assert.equal(value.extra, 'Dog at home.');
});

test('empty request returns the design’s messages', () => {
  const { errors } = validateRequest({}, { services: SERVICES, today: TODAY });
  assert.equal(errors.name, 'Enter your name.');
  assert.equal(errors.phone, 'Enter a phone number so we can reach you.');
  assert.equal(errors.email, 'Enter your email address.');
  assert.equal(errors.service, 'Choose a service type, or “Other Plumbing Issue.”');
  assert.equal(errors.issue, 'Describe the issue in a few words.');
  assert.equal(errors.location, 'Enter your city, town or ZIP code.');
  assert.equal(errors.preferredWindow, 'Choose a preferred time of day.');
  assert.equal(errors.preferredDate, undefined, 'date is optional');
  assert.equal(errors.extra, undefined, 'extra is optional');
});

test('lengths, enums and dates', () => {
  assert.equal(errs({ name: 'A' }).name, 'Name should be at least 2 characters.');
  assert.equal(errs({ name: 'x'.repeat(81) }).name, 'Use 80 characters or fewer.');
  assert.equal(errs({ issue: 'leak' }).issue, 'Add a little more detail (at least 10 characters).');
  assert.equal(errs({ issue: 'x'.repeat(1501) }).issue, 'Keep the description to 1,500 characters or fewer.');
  assert.equal(errs({ extra: 'x'.repeat(1501) }).extra, 'Keep this to 1,500 characters or fewer.');
  assert.equal(errs({ email: 'a@b' }).email, 'Enter an email address like name@example.com.');
  assert.equal(errs({ service: 'roofing' }).service, 'Choose a service type, or “Other Plumbing Issue.”');
  assert.equal(errs({ service: 'other' }).service, undefined);
  assert.equal(errs({ preferredWindow: 'evening' }).preferredWindow, 'Choose a preferred time of day.');
  assert.equal(errs({ preferredDate: '2026-10-12' }).preferredDate, 'Choose today or a later date.');
  assert.equal(errs({ preferredDate: '2026-02-30' }).preferredDate, 'Enter a valid date.');
  assert.equal(errs({ preferredDate: '2026-10-13' }).preferredDate, undefined);
});

test('location: city or 5-digit ZIP', () => {
  assert.equal(errs({ location: 'C' }).location, 'Enter a city, town or 5-digit ZIP code.');
  assert.equal(errs({ location: '2820' }).location, 'We couldn’t recognise this location. Enter a city name or a 5-digit ZIP code.');
  assert.equal(errs({ location: '28202-1234' }).location, undefined);
  assert.equal(errs({ location: 'Charlotte' }).location, undefined);
  assert.equal(errs({ location: 'x'.repeat(81) }).location, 'Use 80 characters or fewer.');
});

test('phone: allowed characters, 7–15 digits, E.164', () => {
  const e = (phone: string) => errs({ phone }).phone;
  assert.equal(e('12345'), 'Enter a phone number with 7 to 15 digits.');
  assert.equal(e('call me'), 'Use digits, spaces, brackets, dashes or a leading +.');
  assert.equal(e('+1 (602) 833-3185'), undefined);
  assert.equal(e('+44 20 7946 0958'), undefined);
  assert.equal(toE164('+1 (602) 833-3185'), '+16028333185');
  assert.equal(toE164('602.833.3185'), '+16028333185');
  assert.equal(toE164('+44 20 7946 0958'), '+442079460958');
  assert.equal(toE164('12'), null);
  assert.equal(formatPhone('+16028333185'), '+1 (602) 833-3185');
});

test('honeypot, references and CSV safety', () => {
  assert.equal(isHoneypot({ company: 'Acme' }), true);
  assert.equal(isHoneypot({ company: '' }), false);
  assert.equal(publicRef(1), 'WP-1101');
  assert.equal(publicRef(42), 'WP-1142');
  assert.equal(csvSafe('=cmd()'), `"'=cmd()"`);
  assert.equal(csvSafe('a "b"'), '"a ""b"""');
});

test('service-area lookup matches the approved list only', () => {
  assert.equal(checkArea('', []).text, 'Enter a city, town or ZIP code to check.');
  assert.equal(checkArea('28202', []).text, 'Please contact us to confirm service availability.');
  assert.equal(checkArea('Springfield', []).text, 'We couldn’t verify that location. Contact us to check.');
  const areas = [{ name: 'Charlotte', zips: ['28202', '28203'] }];
  assert.equal(checkArea('charlotte', areas).kind, 'ok');
  assert.equal(checkArea('Charlotte, NC', areas).kind, 'ok');
  assert.equal(checkArea('28203', areas).text, 'This location is listed as a service area.');
  assert.equal(checkArea('28299', areas).kind, 'info');
});

test('session helpers: cookie parsing and constant-time CSRF compare', () => {
  assert.deepEqual(parseCookies('wp_session=abc.def; wp_csrf=xyz%3D'), { wp_session: 'abc.def', wp_csrf: 'xyz=' });
  assert.deepEqual(parseCookies(undefined), {});
  assert.equal(sameToken('abc', 'abc'), true);
  assert.equal(sameToken('abc', 'abd'), false);
  assert.equal(sameToken('', ''), false);
});

test('service and content validation', () => {
  assert.equal(validateService({ title: '' }).errors.title, 'Enter a service title.');
  assert.equal(validateService({ title: 'Sump pumps', slug: 'other' }).errors.slug, '“other” is reserved for the form’s “Other Plumbing Issue” option.');
  assert.equal(validateService({ title: 'Sump pumps', published: true }).errors.short, 'Add a short summary (at least 10 characters) before publishing.');
  assert.equal(validateService({ title: 'Sump pumps', signs: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }).errors.signs, 'Use 6 signs or fewer.');
  const area = CONTENT_TYPE_MAP.get('service-area')!;
  assert.equal(validateContentFields(area, { name: 'Charlotte', zips: '28202\n2820' }).errors.zips, 'Enter each ZIP code as 5 digits, one per line.');
  assert.deepEqual(validateContentFields(area, { name: 'Charlotte', zips: '28202\n28203' }).errors, {});
  const faq = CONTENT_TYPE_MAP.get('faq')!;
  assert.deepEqual(validateContentFields(faq, { q: 'Hours?', a: '', home: 'no' }).errors, {}, 'pending FAQ allowed');
});

test('every seeded service and content row passes its own validation', () => {
  for (const s of SERVICES_SEED) assert.deepEqual(validateService({ ...s, published: true }).errors, {}, s.title);
  for (const [type, rows] of Object.entries(CONTENT_SEED)) {
    const def = CONTENT_TYPE_MAP.get(type)!;
    assert.ok(def, type);
    for (const r of rows) assert.deepEqual(validateContentFields(def, r.fields).errors, {}, `${type}: ${JSON.stringify(r.fields).slice(0, 40)}`);
  }
  assert.equal(CONTENT_SEED.faq.filter((f) => f.fields.home === 'yes').length, 4, 'design previews 4 FAQs on home');
  assert.equal(CONTENT_SEED.faq.filter((f) => !f.fields.a).length, 3, 'three answers pending in the design');
});

console.log(`\n${passed} checks passed`);
