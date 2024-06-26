import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { database, storage } from "./firebase";
import { getDownloadURL, ref } from "firebase/storage";
import "./App.css";

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
      setImageAAfficher(url);
    });
  }, []);

  // const [imageAAfficher, setImageAAfficher] = useState([]);

  const onMidiMessage = (midiEvent) => {
    let data = midiEvent.data;
    // console.log(data);
    // la longueur des données Midi conditionne la recherche (2 = Chanson) reception que si l'on a 2 octets (commande et note).
    if (data.length === 2) {
      let command = data[0] >>> 4; // command est le quatrieme bit du premier octet "data".
      let channel = (data[0] & 0xf) + 1; // Status converti en hexadecimal pour en déduire le canal MIDI et j'ajoute 1 pour me situer entre (1-16) au lieu de (0-15).
      if (command === 0xc) {
        // Si la commande Midi = (192-207: demande de changement de programme)
        programme = data[1] + 1; // j'ajoute 1 à deuxiemeOctet pour me situer entre (1-128) au lieu de (0-127).
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
        //  deuxiemeOctet est le deuxieme octet de la donnée "data".
        let note = data[1] + 1; // j'ajoute 1 à deuxiemeOctet pour me situer entre (1-128) au lieu de (0-127).
        // let velocity = data[2];

        switch (note) {
          case 25:
            note = "C0";
            break;
          case 37:
            note = "C1";
            break;
          case 49:
            note = "C2";
            break;
          case 61:
            note = "C3";
            break;
          case 73:
            note = "C4";
            break;
          case 85:
            note = "C5";
            break;
          case 97:
            note = "C6";
            break;
          case 109:
            note = "C7";
            break;
          case 121:
            note = "C8";
            break;

          default:
            console.log(`Sorry, we are out of.`);
        }

        console.log(data[1] + 1);
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
    <div class="ecran">
      <h4 class="h4">{chansonAAfficher.titre}</h4>
      <h4 class="h4">{chansonAAfficher.artiste}</h4>
      <h4 class="h4">Canal-MIDI: {chansonAAfficher.canalMidi}</h4>
      <h4 class="h4">Program-MIDI: {chansonAAfficher.programMidi}</h4>
      <img class="vignette" alt="vignette" src={chansonAAfficher.vignette} />
      <img class="prompteur" alt="Prompteur" src={imageAAfficher} />
    </div>
  );
}
export default App;
