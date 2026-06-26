import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────
// TOKENS DE DISEÑO OFICIALES (INMOVIRAL MATCHED)
// ─────────────────────────────────────────────
const T = {
  gold:         '#A07840',
  bgSection:    '#EAE2D6',
  bgCard:       '#FFFFFF',
  textMain:     '#0F0D0A',
  textSub:      '#525252',
  borderLine:   'rgba(0,0,0,0.05)',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const TESTIMONIALS_DATA = [
  {
    id: 'testi1',
    name: 'Mauro Lombardo',
    avatar: require('../assets/mauro.jpg'),
    stars: 5,
  },
  {
    id: 'testi2',
    name: 'Benito Ocasio',
    avatar: require('../assets/benito.jpg'),
    stars: 5,
  },
  {
    id: 'testi3',
    name: 'Michael Torres',
    avatar: require('../assets/michael.jpg'),
    stars: 5,
  },
];

export default function Testimonios() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const isWide = width > 768;

  return (
    <View style={[s.sectionContainer, { paddingHorizontal: isWide ? 60 : 24 }]}>
      {/* ── Encabezado de Sección ── */}
      <View style={s.headerContainer}>
        <Text style={s.sectionLabel}>{t('testimonials.label')}</Text>
        <Text style={s.sectionTitle}>{t('testimonials.title')}</Text>
      </View>

      {/* ── Grid/Lista de Tarjetas ── */}
      <View style={s.cardsWrapper}>
        <View style={[s.cardsGrid, isWide ? s.cardsGridRow : s.cardsGridCol]}>
          {TESTIMONIALS_DATA.map((item) => {
            const isHovered = hoveredCardId === item.id;

            return (
              <Pressable
                key={item.id}
                onMouseEnter={() => Platform.OS === 'web' && setHoveredCardId(item.id)}
                onMouseLeave={() => Platform.OS === 'web' && setHoveredCardId(null)}
                style={[
                  s.card,
                  isWide ? s.cardWide : s.cardMobile,
                  isHovered && s.cardHovered,
                ]}
              >
                {/* Comillas decorativas gigantes */}
                <Text style={s.quoteMark}>“</Text>

                {/* Comentario en cursiva */}
                <Text style={s.comentarioText}>
                  {t(`testimonials.${item.id}.q`)}
                </Text>

                {/* Separador sutil */}
                <View style={s.separator} />

                {/* Fila del Autor */}
                <View style={s.authorRow}>
                  <Image source={item.avatar} style={s.avatarImage} />
                  <View style={s.authorInfo}>
                    <Text style={s.authorName}>{item.name}</Text>
                    <Text style={s.authorMeta}>
                      {t(`testimonials.${item.id}.r`)}
                    </Text>
                  </View>
                </View>

                {/* Fila de estrellas doradas */}
                <View style={s.starsRow}>
                  {Array.from({ length: item.stars }).map((_, starIdx) => (
                    <Text key={starIdx} style={s.starIcon}>★</Text>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// ESTILOS DE LA SECCIÓN
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  sectionContainer: {
    backgroundColor: T.bgSection,
    paddingVertical: 90,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 60,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  sectionLabel: {
    color: T.gold,
    fontFamily: T.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: T.serif,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '400',
    color: T.textMain,
  },
  cardsWrapper: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  cardsGrid: {
    justifyContent: 'space-between',
    gap: 30,
  },
  cardsGridRow: {
    flexDirection: 'row',
  },
  cardsGridCol: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: T.bgCard,
    padding: 36,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  cardWide: {
    flex: 1,
    minWidth: 280,
  },
  cardMobile: {
    width: '100%',
  },
  cardHovered: {
    transform: [{ translateY: -4 }],
    ...Platform.select({
      web: {
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  quoteMark: {
    fontFamily: T.serif,
    fontSize: 54,
    color: T.gold,
    lineHeight: 42,
    height: 32,
    marginTop: -10,
    marginBottom: 8,
  },
  comentarioText: {
    fontFamily: T.serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 24,
    color: T.textSub,
    marginBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: T.borderLine,
    marginBottom: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'cover',
  },
  authorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: T.sans,
    fontSize: 13,
    fontWeight: '600',
    color: T.textMain,
    marginBottom: 2,
  },
  authorMeta: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.gold,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  starIcon: {
    color: T.gold,
    fontSize: 12,
  },
});
