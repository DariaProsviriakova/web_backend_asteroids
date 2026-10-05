export type CurrentObserver = {
  id: number;
  email: string;
  fullName: string;
};

const CURRENT_OBSERVER: CurrentObserver = Object.freeze({
  id: 1,
  email: "daria@example.com",
  fullName: "Дарья Просвиракова"
});

let currentObserverSingleton: CurrentObserver | null = null;

export const getCurrentObserver = () => {
  if (!currentObserverSingleton) {
    currentObserverSingleton = CURRENT_OBSERVER;
  }

  return currentObserverSingleton;
};
