/** Payload broadcast from phone to kiosk during pairing */
export interface PairingBroadcastPayload {
  type: 'screen_selected';
  shortCode: string;
  screenName: string;
  mosqueName: string;
}

/** Stored in localStorage on the kiosk after pairing */
export interface KioskPairedState {
  shortCode: string;
  screenName: string;
  mosqueName: string;
  pairedAt: string;
}

/** Mosque result shape for the pairing search */
export interface PairingMosqueResult {
  id: string;
  name: string;
}

/** Screen result shape for the pairing picker */
export interface PairingScreenResult {
  id: string;
  name: string;
  short_code: string;
}
