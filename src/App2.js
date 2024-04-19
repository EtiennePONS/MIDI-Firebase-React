import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { database, storage } from "./firebase";
import { getDownloadURL, ref } from "firebase/storage";

function App() {
  const [chansonAAfficher, setChansonAAfficher] = useState([]);
  let programme = null;
  const [imageAAfficher, setImageAAfficher] = useState();
  useEffect(() => {
    window.navigator
      .requestMIDIAccess()
      .then((midiAccess) => {
        console.log(
          "SUPER!!! Ce navigateur est en capacité de recevoir et d'envoyer des signaux numériques MIDI... 😊"
        );
        // console.log(midiAccess);
        for (let entry of midiAccess.inputs) {
          // console.log("MIDI input device: " + entry[1].id);
          entry[1].onmidimessage = onMidiMessage;
        }
      })
      .catch((error) => {
        console.log(
          "Connection IMPOSSIBLE: Ce navigateur n'est pas en capacité de recevoir et d'envoyer des signaux numériques MIDI... 🙄",
          error
        );
      });
    const imageRef = ref(storage, `default.jpg`);
    getDownloadURL(imageRef).then((url) => {
      console.log(url);
      setImageAAfficher(url);
    });
  }, []);

  // const [imageAAfficher, setImageAAfficher] = useState([]);

  const onMidiMessage = (midiEvent) => {
    let data = midiEvent.data;
    // console.log(data);
    // la longueur des données Midi conditionne la recherche (2 = Chanson) reception que si l'on a 2 octets (commande et note).
    if (data.length === 2) {
      let status = data[0]; // status est le premier octet de la donnée "data".
      let command = status >>> 4; // command est le quatrieme bit du premier octet "data".
      let channel = (status & 0xf) + 1; // Status converti en hexadecimal pour en déduire le canal MIDI et j'ajoute 1 pour me situer entre (1-16) au lieu de (0-15).
      if (command === 0xc) {
        // Si la commande Midi = (192-207: demande de changement de programme)
        let deuxiemeOctet = data[1]; //  deuxiemeOctet est le deuxieme octet de la donnée "data".
        programme = deuxiemeOctet + 1; // j'ajoute 1 à deuxiemeOctet pour me situer entre (1-128) au lieu de (0-127).
        // console.log(`Canal MIDI: ${channel}, Programme MIDI: ${programme}`);

        const chansonRef = doc(database, "chansons", `${channel}-${programme}`);
        const getChanson = async () => {
          const chanson = await getDoc(chansonRef);
          if (chanson.exists()) {
            // console.log("Document data:", chanson.data());
            setChansonAAfficher(chanson.data());
          } else {
            // docSnap.data() will be undefined in this case
            console.log("Pas de chanson, sur cette reference...");
          }
        };
        getChanson();
      }
      // la longueur des données Midi conditionne la recherche (3 = Visuel) reception que si l'on a 3 octets (commande, note, et velocité)
    } else if (data.length === 3) {
      let status = data[0]; // status est le premier octet de la donnée "data".
      let command = status >>> 4; // command est le quatrieme bit du premier octet "data".
      let channel = (status & 0xf) + 1; // Status converti en hexadecimal pour en déduire le canal MIDI et j'ajoute 1 pour me situer entre (1-16) au lieu de (0-15).
      if (command === 0x9) {
        //Si la commande Midi = (144-159: demande d'attaque de note: NoteOn).
        let deuxiemeOctet = data[1]; //  deuxiemeOctet est le deuxieme octet de la donnée "data".
        let note = deuxiemeOctet + 1; // j'ajoute 1 à deuxiemeOctet pour me situer entre (1-128) au lieu de (0-127).
        // let velocity = data[2];
        console.log(
          `Canal MIDI: ${channel}, Programme MIDI: ${programme} , Note MIDI: ${note}`
        );
        const imageRef = ref(storage, `${channel}-${programme}/${note}.jpg`);
        getDownloadURL(imageRef).then((url) => {
          console.log(url);
          setImageAAfficher(url);
        });
      }
    }
  };

  return (
    <div className="App">
      <h1>Chanson: {chansonAAfficher.titre}</h1>
      <h1>Canal-MIDI: {chansonAAfficher.canalMidi}</h1>
      <h1>Program-MIDI: {chansonAAfficher.programMidi}</h1>
      <img alt="Prompteur" src={imageAAfficher} />;
    </div>
  );
}
export default App;
