export interface ChandaInfo {
  name: string;
  rate: string;
  description: string;
}

export const chandaRates: ChandaInfo[] = [
  {
    name: 'Chanda Aam',
    rate: '6,25% des monatlichen Nettoeinkommens',
    description: 'Allgemeiner Beitrag für Gemeindebedürfnisse'
  },
  {
    name: 'Chanda Wasiyyat',
    rate: '10% des monatlichen Nettoeinkommens',
    description: 'Spezielle Beitragsleistung für angestellte Mitglieder'
  },
  {
    name: 'Khuddam-ul-Ahmadiyya',
    rate: '1% des Nettoeinkommens',
    description: 'Unterstützung der Aktivitäten der Jugendorganisation Khuddam-ul-Ahmadiyya'
  },
  {
    name: 'Jalsa Salana',
    rate: '1/22 des monatlichen Nettoeinkommens',
    description: 'Finanzierung der jährlichen Versammlung Jalsa Salana'
  },
  {
    name: 'Tehrik-e-Jadid',
    rate: 'Freiwillig, ohne festgelegten Betrag',
    description: 'Förderung der weltweiten Missionsarbeit und Verbreitung der islamischen Lehre'
  },
  {
    name: 'Waqf-e-Jadid',
    rate: 'Freiwillig, ohne festgelegten Betrag',
    description: 'Stärkung der religiösen Bildung und Missionsarbeit in ländlichen Gebieten, insbesondere in Südasien'
  },
  {
    name: 'Sadqa',
    rate: 'Freiwillig, ohne festgelegten Betrag',
    description: 'Unterstützung Bedürftiger und Förderung sozialer Gerechtigkeit'
  },
  {
    name: 'Zakat',
    rate: '2,5% des angesammelten Vermögens',
    description: 'Reinigung des Vermögens und Unterstützung der Bedürftigen'
  }
];
