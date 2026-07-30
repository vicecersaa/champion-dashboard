import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown, Save, RotateCcw, Plus, Trash2, Sparkles, Tag, LayoutGrid,
  BookOpen, Hammer, Layers, Images, Quote, Mail,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileUpload } from '../components/ui/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { HomepageFormState } from '../lib/types';

const ASSET = 'https://forland-living.vicecersaa.workers.dev/assets';

const DEFAULT_CONTENT: HomepageFormState = {
  hero: {
    badge: 'Koleksi Aera — Musim Semi',
    title: 'Cara yang lebih tenang mengakhiri hari.',
    description:
      'Bed dan kasur premium yang lahir dari keyakinan bahwa kenyamanan sejati bersifat tenang — material jujur, tangan yang tidak tergesa, dan ruang yang benar-benar mengistirahatkan Anda.',
    primaryCtaText: 'Jelajahi Koleksi →',
    primaryCtaLink: '/shop',
    secondaryCtaText: 'Kenali Cerita Kami',
    secondaryCtaLink: '/about',
    smallText: 'Est. 2014 — Oslo',
    image: `${ASSET}/hero-bedroom-DUHq7D8r.jpg`,
  },
  promoCards: [
    {
      label: 'Gajian Sale',
      title: 'Hemat Rp1.300.000',
      description: 'Kasur premium + gratis ongkir Jabodetabek. Berakhir 30 hari lagi.',
      ctaText: 'Belanja Sekarang →',
      ctaLink: '/shop',
      image: `${ASSET}/product-bed-1-BsybRGZO.jpg`,
    },
    {
      label: 'Free Shipping',
      title: 'Gratis Pengiriman',
      description: 'Setiap pembelian kasur ke seluruh kota besar di Indonesia.',
      ctaText: 'Lihat Koleksi →',
      ctaLink: '/shop',
      image: `${ASSET}/product-bed-2-BvhrFqxs.jpg`,
    },
    {
      label: '10-Year Guarantee',
      title: 'Jaminan Struktural',
      description: 'Kepercayaan diri dari pengerjaan lokal yang jujur dan teruji.',
      ctaText: 'Pelajari Lebih →',
      ctaLink: '/shop',
      image: `${ASSET}/gallery-1-BiJF-Jsy.jpg`,
    },
  ],
  collection: {
    label: 'Koleksi',
    title: 'Disusun untuk sebuah ruang.',
    viewAllText: 'Lihat Semua',
    viewAllLink: '/shop',
    items: [
      { title: 'Bed', subtitle: 'Rangka dari oak, walnut, dan pelapis linen.', link: '/shop', image: '' },
      { title: 'Kasur', subtitle: 'Lima belas lapis dukungan yang tenang.', link: '/shop', image: '' },
      { title: 'Kamar Tidur', subtitle: 'Sebuah ruang, dirancang menyeluruh.', link: '/shop', image: '' },
      { title: 'Koleksi Baru', subtitle: 'Musim ini, diperkenalkan dengan lembut.', link: '/shop', image: '' },
    ],
  },
  philosophy: {
    label: 'Filosofi Kami',
    title: 'Kemewahan seharusnya terasa hidup, bukan dipertontonkan.',
    paragraph1:
      'Kami percaya bahwa istirahat adalah sebuah disiplin. Karena itu, setiap benda di sekitarnya kami rawat dengan sungguh-sungguh — bed yang membuat Anda melebur tanpa berpikir, kasur yang memeluk seperti tarikan napas panjang, dan linen yang semakin lembut seiring waktu.',
    paragraph2:
      'Tidak ada yang berteriak di sini. Semua ditempatkan dengan niat. Forland Living adalah praktik ketenangan — sebuah rumah berisi karya yang dibuat untuk melampaui tren, cuaca, dan hiruk pikuk hari.',
    image: `${ASSET}/philosophy-CVA_1vnh.jpg`,
  },
  craftsmanship: {
    label: 'Pengerjaan',
    title: 'Dibuat perlahan, agar Anda dapat hidup perlahan.',
    intro:
      'Setiap karya Forland dimulai dari sebuah gambar dan diakhiri dengan tanda tangan. Di antara keduanya, berminggu-minggu pekerjaan yang terukur — tanpa jahitan yang terburu, tanpa material yang disembunyikan, tanpa jalan pintas.',
    items: [
      { number: '01', title: 'Material Jujur', description: 'Flax Eropa, latex alami, oak kering oven, dan wool murni.' },
      { number: '02', title: 'Tangan Lokal', description: 'Setiap rangka dan kasur dirakit oleh tim kecil di Oslo.' },
      { number: '03', title: 'Kenyamanan Terukur', description: 'Lima belas lapis presisi, dipetakan sesuai lekuk tubuh.' },
      { number: '04', title: 'Dirancang untuk Berumur', description: 'Sambungan yang dapat diperbaiki. Garansi struktural 25 tahun.' },
    ],
    image: `${ASSET}/craftsmanship-CETQrU27.jpg`,
  },
  materialStudy: {
    label: 'Studi Material — N° 03',
    title: 'Flax Belgia. Dilembutkan oleh cuaca, bukan kimia.',
    paragraph:
      'Linen kami berasal dari satu pabrik keluarga di West Flanders. Benangnya ditenun perlahan, lalu dicuci batu dalam air sungai hingga jatuh dengan sentuhan lembut dan hidup yang menjadi ciri setiap bed Forland.',
    ctaText: 'Baca Jurnal Material →',
    ctaLink: '/journal',
    image: `${ASSET}/material-linen-BkWHxD46.jpg`,
  },
  gallery: {
    title: 'Ruang yang bernapas.',
    images: [
      `${ASSET}/gallery-1-BiJF-Jsy.jpg`,
      `${ASSET}/philosophy-CVA_1vnh.jpg`,
      `${ASSET}/gallery-2-CTnh1ENj.jpg`,
      `${ASSET}/product-bed-2-BvhrFqxs.jpg`,
    ],
  },
  testimonials: {
    label: 'N° 04 · Ulasan',
    title: 'Suara dari mereka yang tidur di dalamnya.',
    testimonials: [
      { quote: 'Bed pertama yang saya miliki yang terasa menjadi bagian dari kamar, bukan dari katalog.', name: 'INES M.', location: 'Copenhagen', rating: 5 },
      { quote: 'Tidur diam-diam menjadi bagian paling saya pertimbangkan dari hari saya.', name: 'JULIAN W.', location: 'Berlin', rating: 5 },
      { quote: 'Anda bisa merasakan jam kerja di dalamnya. Itulah pujian terbaik yang bisa saya berikan.', name: 'AIKO S.', location: 'Kyoto', rating: 5 },
    ],
  },
  newsletter: {
    label: 'Surat Berkala',
    title: 'Surat sesekali tentang istirahat, ruang, dan pembuatan karya yang tenang.',
    buttonText: 'Berlangganan →',
    disclaimer: 'Tidak lebih dari sekali sebulan. Berhenti langganan kapan saja.',
  },
};

function TextAreaField({
  label, value, onChange, hint, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function ImageField({
  label, value, onChange,
}: { label: string; value: string | File; onChange: (v: string | File) => void }) {
  const isFile = value instanceof File;
  return (
    <FileUpload
      type="image"
      label={label}
      multiple={false}
      files={isFile ? [value as File] : []}
      onFilesChange={(files) => onChange(files[0] ?? (isFile ? '' : value))}
      existing={!isFile && value ? [value as string] : []}
    />
  );
}

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ icon, title, subtitle, active, onToggle, children }: SectionProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${active ? 'rotate-180' : ''}`} />
      </button>
      {active && (
        <div className="px-5 pb-5 pt-4 space-y-4 border-t border-gray-100 dark:border-gray-800">
          {children}
        </div>
      )}
    </Card>
  );
}

export function Homepage() {
  const { toast } = useToast();
  const [form, setForm] = useState<HomepageFormState>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('hero');

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getHomepageContent();
      setForm(result as unknown as HomepageFormState);
    } catch {
      // Belum ada data tersimpan di backend — tetap pakai draf awal (isi homepage saat ini)
      toast('Belum ada konten tersimpan, menampilkan draf dari homepage saat ini', 'warning');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const toggleSection = (id: string) => setActiveSection((prev) => (prev === id ? null : id));

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await api.updateHomepageContent(form);
      setForm(updated as unknown as HomepageFormState);
      toast('Konten homepage berhasil disimpan', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan konten homepage', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, toast]);

  const handleReset = useCallback(() => {
    setForm(DEFAULT_CONTENT);
    toast('Form dikembalikan ke draf awal', 'success');
  }, [toast]);

  // ---- update helpers ----
  const updateHero = (patch: Partial<HomepageFormState['hero']>) =>
    setForm((f) => ({ ...f, hero: { ...f.hero, ...patch } }));

  const updatePromoCard = (idx: number, patch: Partial<HomepageFormState['promoCards'][number]>) =>
    setForm((f) => ({ ...f, promoCards: f.promoCards.map((c, i) => (i === idx ? { ...c, ...patch } : c)) }));

  const updateCollectionMeta = (patch: Partial<Omit<HomepageFormState['collection'], 'items'>>) =>
    setForm((f) => ({ ...f, collection: { ...f.collection, ...patch } }));

  const updateCollectionItem = (idx: number, patch: Partial<HomepageFormState['collection']['items'][number]>) =>
    setForm((f) => ({
      ...f,
      collection: { ...f.collection, items: f.collection.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) },
    }));

  const updatePhilosophy = (patch: Partial<HomepageFormState['philosophy']>) =>
    setForm((f) => ({ ...f, philosophy: { ...f.philosophy, ...patch } }));

  const updateCraftsmanshipMeta = (patch: Partial<Omit<HomepageFormState['craftsmanship'], 'items'>>) =>
    setForm((f) => ({ ...f, craftsmanship: { ...f.craftsmanship, ...patch } }));

  const updateCraftItem = (idx: number, patch: Partial<HomepageFormState['craftsmanship']['items'][number]>) =>
    setForm((f) => ({
      ...f,
      craftsmanship: {
        ...f.craftsmanship,
        items: f.craftsmanship.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
      },
    }));

  const updateMaterialStudy = (patch: Partial<HomepageFormState['materialStudy']>) =>
    setForm((f) => ({ ...f, materialStudy: { ...f.materialStudy, ...patch } }));

  const updateGalleryTitle = (title: string) =>
    setForm((f) => ({ ...f, gallery: { ...f.gallery, title } }));

  const updateGalleryImage = (idx: number, value: string | File) =>
    setForm((f) => ({ ...f, gallery: { ...f.gallery, images: f.gallery.images.map((img, i) => (i === idx ? value : img)) } }));

  const updateTestimonialsMeta = (patch: Partial<Omit<HomepageFormState['testimonials'], 'testimonials'>>) =>
    setForm((f) => ({ ...f, testimonials: { ...f.testimonials, ...patch } }));

  const updateTestimonial = (idx: number, patch: Partial<HomepageFormState['testimonials']['testimonials'][number]>) =>
    setForm((f) => ({
      ...f,
      testimonials: {
        ...f.testimonials,
        testimonials: f.testimonials.testimonials.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
      },
    }));

  const addTestimonial = () =>
    setForm((f) => ({
      ...f,
      testimonials: {
        ...f.testimonials,
        testimonials: [...f.testimonials.testimonials, { quote: '', name: '', location: '', rating: 5 }],
      },
    }));

  const removeTestimonial = (idx: number) =>
    setForm((f) => ({
      ...f,
      testimonials: { ...f.testimonials, testimonials: f.testimonials.testimonials.filter((_, i) => i !== idx) },
    }));

  const updateNewsletter = (patch: Partial<HomepageFormState['newsletter']>) =>
    setForm((f) => ({ ...f, newsletter: { ...f.newsletter, ...patch } }));

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 skeleton bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ubah copywriting dan gambar di halaman utama. Navbar &amp; footer tidak termasuk di sini.
        </p>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset ke Draf
        </Button>
      </div>

      {/* 1. Hero */}
      <Section
        id="hero"
        icon={<Sparkles className="h-4 w-4" />}
        title="Hero"
        subtitle="Banner utama paling atas"
        active={activeSection === 'hero'}
        onToggle={() => toggleSection('hero')}
      >
        <Input label="Badge Text" value={form.hero.badge} onChange={(e) => updateHero({ badge: e.target.value })} />
        <Input label="Judul" value={form.hero.title} onChange={(e) => updateHero({ title: e.target.value })} />
        <TextAreaField label="Deskripsi" value={form.hero.description} onChange={(v) => updateHero({ description: v })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teks Tombol Utama" value={form.hero.primaryCtaText} onChange={(e) => updateHero({ primaryCtaText: e.target.value })} />
          <Input label="Link Tombol Utama" value={form.hero.primaryCtaLink} onChange={(e) => updateHero({ primaryCtaLink: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teks Tombol Kedua" value={form.hero.secondaryCtaText} onChange={(e) => updateHero({ secondaryCtaText: e.target.value })} />
          <Input label="Link Tombol Kedua" value={form.hero.secondaryCtaLink} onChange={(e) => updateHero({ secondaryCtaLink: e.target.value })} />
        </div>
        <Input label="Teks Kecil" value={form.hero.smallText} onChange={(e) => updateHero({ smallText: e.target.value })} hint='Mis. "Est. 2014 — Oslo"' />
        <ImageField label="Gambar Hero" value={form.hero.image} onChange={(v) => updateHero({ image: v })} />
      </Section>

      {/* 2. Promo Cards */}
      <Section
        id="promo"
        icon={<Tag className="h-4 w-4" />}
        title="Kartu Promo"
        subtitle="3 kartu di bawah hero"
        active={activeSection === 'promo'}
        onToggle={() => toggleSection('promo')}
      >
        {form.promoCards.map((card, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kartu {idx + 1}</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Label" value={card.label} onChange={(e) => updatePromoCard(idx, { label: e.target.value })} />
              <Input label="Judul" value={card.title} onChange={(e) => updatePromoCard(idx, { title: e.target.value })} />
            </div>
            <TextAreaField label="Deskripsi" value={card.description} onChange={(v) => updatePromoCard(idx, { description: v })} rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Teks CTA" value={card.ctaText} onChange={(e) => updatePromoCard(idx, { ctaText: e.target.value })} />
              <Input label="Link CTA" value={card.ctaLink} onChange={(e) => updatePromoCard(idx, { ctaLink: e.target.value })} />
            </div>
            <ImageField label="Gambar" value={card.image} onChange={(v) => updatePromoCard(idx, { image: v })} />
          </div>
        ))}
      </Section>

      {/* 3. Collection Grid */}
      <Section
        id="collection"
        icon={<LayoutGrid className="h-4 w-4" />}
        title="Grid Koleksi"
        subtitle='"Disusun untuk sebuah ruang"'
        active={activeSection === 'collection'}
        onToggle={() => toggleSection('collection')}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label Section" value={form.collection.label} onChange={(e) => updateCollectionMeta({ label: e.target.value })} />
          <Input label="Judul Section" value={form.collection.title} onChange={(e) => updateCollectionMeta({ title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label='Teks "Lihat Semua"' value={form.collection.viewAllText} onChange={(e) => updateCollectionMeta({ viewAllText: e.target.value })} />
          <Input label="Link Lihat Semua" value={form.collection.viewAllLink} onChange={(e) => updateCollectionMeta({ viewAllLink: e.target.value })} />
        </div>
        {form.collection.items.map((item, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Item {idx + 1}</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Judul" value={item.title} onChange={(e) => updateCollectionItem(idx, { title: e.target.value })} />
              <Input label="Link" value={item.link} onChange={(e) => updateCollectionItem(idx, { link: e.target.value })} />
            </div>
            <Input label="Subjudul" value={item.subtitle} onChange={(e) => updateCollectionItem(idx, { subtitle: e.target.value })} />
            <ImageField label="Gambar" value={item.image} onChange={(v) => updateCollectionItem(idx, { image: v })} />
          </div>
        ))}
      </Section>

      {/* 4. Philosophy */}
      <Section
        id="philosophy"
        icon={<BookOpen className="h-4 w-4" />}
        title="Filosofi Kami"
        subtitle="Section cerita brand"
        active={activeSection === 'philosophy'}
        onToggle={() => toggleSection('philosophy')}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.philosophy.label} onChange={(e) => updatePhilosophy({ label: e.target.value })} />
          <Input label="Judul" value={form.philosophy.title} onChange={(e) => updatePhilosophy({ title: e.target.value })} />
        </div>
        <TextAreaField label="Paragraf 1" value={form.philosophy.paragraph1} onChange={(v) => updatePhilosophy({ paragraph1: v })} rows={3} />
        <TextAreaField label="Paragraf 2" value={form.philosophy.paragraph2} onChange={(v) => updatePhilosophy({ paragraph2: v })} rows={3} />
        <ImageField label="Gambar" value={form.philosophy.image} onChange={(v) => updatePhilosophy({ image: v })} />
      </Section>

      {/* 5. Craftsmanship */}
      <Section
        id="craftsmanship"
        icon={<Hammer className="h-4 w-4" />}
        title="Pengerjaan"
        subtitle="4 poin proses pembuatan"
        active={activeSection === 'craftsmanship'}
        onToggle={() => toggleSection('craftsmanship')}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.craftsmanship.label} onChange={(e) => updateCraftsmanshipMeta({ label: e.target.value })} />
          <Input label="Judul" value={form.craftsmanship.title} onChange={(e) => updateCraftsmanshipMeta({ title: e.target.value })} />
        </div>
        <TextAreaField label="Intro" value={form.craftsmanship.intro} onChange={(v) => updateCraftsmanshipMeta({ intro: v })} rows={3} />
        {form.craftsmanship.items.map((item, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-4">
              <Input label="No." value={item.number} onChange={(e) => updateCraftItem(idx, { number: e.target.value })} />
              <Input label="Judul" value={item.title} onChange={(e) => updateCraftItem(idx, { title: e.target.value })} />
            </div>
            <Input label="Deskripsi" value={item.description} onChange={(e) => updateCraftItem(idx, { description: e.target.value })} />
          </div>
        ))}
        <ImageField label="Gambar" value={form.craftsmanship.image} onChange={(v) => updateCraftsmanshipMeta({ image: v })} />
      </Section>

      {/* 6. Material Study */}
      <Section
        id="material"
        icon={<Layers className="h-4 w-4" />}
        title="Studi Material"
        subtitle="Cerita bahan baku"
        active={activeSection === 'material'}
        onToggle={() => toggleSection('material')}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.materialStudy.label} onChange={(e) => updateMaterialStudy({ label: e.target.value })} />
          <Input label="Judul" value={form.materialStudy.title} onChange={(e) => updateMaterialStudy({ title: e.target.value })} />
        </div>
        <TextAreaField label="Paragraf" value={form.materialStudy.paragraph} onChange={(v) => updateMaterialStudy({ paragraph: v })} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teks CTA" value={form.materialStudy.ctaText} onChange={(e) => updateMaterialStudy({ ctaText: e.target.value })} />
          <Input label="Link CTA" value={form.materialStudy.ctaLink} onChange={(e) => updateMaterialStudy({ ctaLink: e.target.value })} />
        </div>
        <ImageField label="Gambar" value={form.materialStudy.image} onChange={(v) => updateMaterialStudy({ image: v })} />
      </Section>

      {/* 7. Gallery */}
      <Section
        id="gallery"
        icon={<Images className="h-4 w-4" />}
        title="Galeri"
        subtitle='"Rumah, Dalam Bidikan" — 4 gambar'
        active={activeSection === 'gallery'}
        onToggle={() => toggleSection('gallery')}
      >
        <Input label="Judul Section" value={form.gallery.title} onChange={(e) => updateGalleryTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          {form.gallery.images.map((img, idx) => (
            <ImageField key={idx} label={`Gambar ${idx + 1}`} value={img} onChange={(v) => updateGalleryImage(idx, v)} />
          ))}
        </div>
      </Section>

      {/* 8. Testimonials */}
      <Section
        id="testimonials"
        icon={<Quote className="h-4 w-4" />}
        title="Testimoni"
        subtitle="Ulasan pelanggan"
        active={activeSection === 'testimonials'}
        onToggle={() => toggleSection('testimonials')}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.testimonials.label} onChange={(e) => updateTestimonialsMeta({ label: e.target.value })} />
          <Input label="Judul" value={form.testimonials.title} onChange={(e) => updateTestimonialsMeta({ title: e.target.value })} />
        </div>
        {form.testimonials.testimonials.map((t, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Testimoni {idx + 1}</p>
              <button
                type="button"
                onClick={() => removeTestimonial(idx)}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <TextAreaField label="Kutipan" value={t.quote} onChange={(v) => updateTestimonial(idx, { quote: v })} rows={2} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Nama" value={t.name} onChange={(e) => updateTestimonial(idx, { name: e.target.value })} />
              <Input label="Lokasi" value={t.location} onChange={(e) => updateTestimonial(idx, { location: e.target.value })} />
              <Input
                type="number"
                label="Rating (1-5)"
                value={t.rating}
                onChange={(e) => updateTestimonial(idx, { rating: Number(e.target.value) || 5 })}
              />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addTestimonial}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Testimoni
        </Button>
      </Section>

      {/* 9. Newsletter */}
      <Section
        id="newsletter"
        icon={<Mail className="h-4 w-4" />}
        title="Newsletter"
        subtitle="Section berlangganan surat"
        active={activeSection === 'newsletter'}
        onToggle={() => toggleSection('newsletter')}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={form.newsletter.label} onChange={(e) => updateNewsletter({ label: e.target.value })} />
          <Input label="Teks Tombol" value={form.newsletter.buttonText} onChange={(e) => updateNewsletter({ buttonText: e.target.value })} />
        </div>
        <TextAreaField label="Judul" value={form.newsletter.title} onChange={(v) => updateNewsletter({ title: v })} rows={2} />
        <Input label="Disclaimer" value={form.newsletter.disclaimer} onChange={(e) => updateNewsletter({ disclaimer: e.target.value })} />
      </Section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 lg:px-6 py-3 flex justify-end z-20">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </Button>
      </div>
    </div>
  );
}