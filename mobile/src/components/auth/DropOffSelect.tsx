import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DROP_OFF_POINTS } from '@unideliver/shared';
import { Brand, Font } from '@/theme/brand';

interface Props {
  value: string | null;
  onChange: (id: string) => void;
  error?: string | null;
}

/** Field-shaped button that opens a bottom sheet of campus drop-off points. */
export function DropOffSelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = DROP_OFF_POINTS.find(p => p.id === value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        Primary Campus Drop-off<Text style={styles.required}> *</Text>
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.box, error ? styles.boxError : null]}
        accessibilityRole="button"
        accessibilityLabel="Select drop-off point"
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected ? selected.label : 'Select drop-off point'}
        </Text>
        <Feather name="chevrons-down" size={20} color={Brand.inkSoft} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Where should we meet you?</Text>
          <Text style={styles.sheetSubtitle}>You can change this for each order later.</Text>

          {DROP_OFF_POINTS.map((point, i) => {
            const isSelected = point.id === value;
            return (
              <Animated.View key={point.id} entering={FadeInRight.delay(40 + i * 30).duration(220).easing(Easing.out(Easing.cubic))}>
                <Pressable
                  onPress={() => {
                    onChange(point.id);
                    setOpen(false);
                  }}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                    <Feather name="map-pin" size={16} color={isSelected ? '#fff' : Brand.green} />
                  </View>
                  <Text style={styles.optionText}>{point.label}</Text>
                  {isSelected ? <Feather name="check" size={20} color={Brand.green} /> : null}
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: Font.semibold, fontSize: 14, color: Brand.ink, marginBottom: 8, paddingHorizontal: 4 },
  required: { color: Brand.danger },
  box: {
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boxError: { borderColor: Brand.danger },
  value: { fontFamily: Font.medium, fontSize: 16, color: Brand.ink, flex: 1 },
  placeholder: { color: Brand.inkMuted },
  error: { fontFamily: Font.medium, fontSize: 12.5, color: Brand.danger, marginTop: 6, paddingHorizontal: 6 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,30,20,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Brand.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.border,
    marginBottom: 16,
  },
  sheetTitle: { fontFamily: Font.extrabold, fontSize: 20, color: Brand.green },
  sheetSubtitle: { fontFamily: Font.regular, fontSize: 14, color: Brand.inkSoft, marginTop: 4, marginBottom: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 6,
  },
  optionSelected: { backgroundColor: Brand.greenTint },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Brand.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: Brand.green },
  optionText: { flex: 1, fontFamily: Font.semibold, fontSize: 15, color: Brand.ink },
});
