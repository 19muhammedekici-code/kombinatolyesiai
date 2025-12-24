import { Category } from './types';

export const CATEGORY_INFO: Record<Category, { title: string; description: string; icon: string }> = {
  [Category.TOP]: {
    title: 'Üst Giyim',
    description: 'Bu bölüme gömlek, tişört, kazak, mont vb. kıyafetleri yükleyin.',
    icon: 'shirt'
  },
  [Category.BOTTOM]: {
    title: 'Alt Giyim',
    description: 'Bu bölüme pantolon, etek vb. kıyafetler yükleyin.',
    icon: 'columns'
  },
  [Category.ONE_PIECE]: {
    title: 'Tek Parça',
    description: 'Bu bölüme boydan olan elbise, tulum, abiye vb. kıyafetler yükleyin. (Bu bölümden en iyi sonucu alabilmek için lütfen model kısmına boydan elbiseli bir fotoğraf yükleyin.)',
    icon: 'gem'
  },
  [Category.SHOES]: {
    title: 'Ayakkabı',
    description: 'Bu bölüme ayakkabı, bot, çizme, spor ayakkabı vb. ürünleri yükleyin.',
    icon: 'footprints'
  },
  [Category.ACCESSORIES]: {
    title: 'Aksesuar',
    description: 'Bu bölüme çanta, takı, gözlük, şapka, kemer vb. tamamlayıcı ürünleri yükleyin.',
    icon: 'sparkles'
  }
};

export const PLACEHOLDER_MODEL = "https://picsum.photos/400/600";