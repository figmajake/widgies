import {
  determineRarityFromValue,
  generateDNA,
  generateDNAFromParentRarities,
  EPOCH,
  WidgieDNA,
  Rarity,
} from "./generator";

const { currentPage, currentUser, getNodeById, notify, widget } = figma;
const {
  AutoLayout,
  Ellipse,
  Frame,
  Image,
  Text,
  useEffect,
  useStickableHost,
  useSyncedState,
  useWidgetId,
} = widget;

const initial = generateDNA();

const fills = [
  "#9e0142",
  "#d53e4f",
  "#f46d43",
  "#fdae61",
  "#fee08b",
  "#e6f598",
  "#abdda4",
  "#66c2a5",
  "#3288bd",
  "#5e4fa2",
];

const textPropsGlobal: TextProps = {
  fontFamily: "Roboto Mono",
  fontWeight: "bold",
};

function renderPie(value: string, rarity: Rarity) {
  const groups: { fill: string; start: number; end: number }[] = [];
  const valueLength = value.length;
  const step = (Math.PI * 2) / valueLength;
  const di = 50;
  const array = value.match(/(\d)\1*/g) || [];
  let pos = Math.PI * -0.5;
  array.forEach((curr, i) => {
    const end = pos + curr.length * step;
    const present = rarity.prominence.data[curr] || curr.length >= 2;
    groups.push({
      fill: present ? fills[Number(curr.charAt(0))] : "#000",
      start: pos,
      end,
    });
    pos = end;
  });
  return (
    <Frame width={di} height={di}>
      {groups.map(({ fill, start, end }, i) => (
        <Ellipse
          key={i}
          arcData={{
            startingAngle: start,
            endingAngle: end,
            innerRadius: 0.4,
          }}
          fill={fill}
          height={di}
          x={{
            type: "horizontal-scale",
            leftOffsetPercent: 0,
            rightOffsetPercent: 0,
          }}
          width={di}
        />
      ))}
    </Frame>
  );
}

function renderValue(value: string, rarity: Rarity, textProps: TextProps = {}) {
  const values = value.split("");
  const absences = Object.keys(rarity.absence.data);
  const textPropsAll: TextProps = {
    ...textPropsGlobal,
    ...textProps,
  };
  return (
    <AutoLayout>
      {values.map((char, i) => {
        const repeat = values[i - 1] === char || values[i + 1] === char;
        return (
          <AutoLayout
            key={i}
            fill={
              rarity.prominence.data[char] || repeat
                ? fills[Number(char)]
                : "#000"
            }
          >
            <Text
              {...textPropsAll}
              fill={rarity.prominence.data[char] || repeat ? "#FFF" : "#666"}
            >
              {char}
            </Text>
          </AutoLayout>
        );
      })}
      <AutoLayout fill={"#000"}>
        <Text {...textPropsAll} fill="#666">
          /
        </Text>
        <Text {...textPropsAll} fill="#FFF">
          {absences.length}
        </Text>
      </AutoLayout>
    </AutoLayout>
  );
}

const generationFromState = (state: { [k: string]: number }) =>
  `${state.generationMin}-${state.generationMax}`;

function Widget() {
  const [owner, setOwner] = useSyncedState<User | null>("owner", null);
  const [dna] = useSyncedState<WidgieDNA>("dna", initial);
  const [parentX] = useSyncedState("parentX", EPOCH);
  const [parentY] = useSyncedState("parentY", EPOCH);
  const [parentXGen] = useSyncedState("parentXGen", "0-0");
  const [parentYGen] = useSyncedState("parentYGen", "0-0");
  const [generationMax] = useSyncedState("generationMax", 1);
  const [generationMin] = useSyncedState("generationMin", 1);
  const widgetId = useWidgetId();
  useEffect(() => {
    if (!owner) {
      setOwner(currentUser);
    }
  });
  const spawn = (node: WidgetNode) => {
    const self: WidgetNode = getNodeById(widgetId) as WidgetNode;
    if (node) {
      const widget = self.cloneWidget({
        dna: generateDNAFromParentRarities(
          dna.rarity,
          node.widgetSyncedState.dna.rarity
        ),
        parentX: dna.value,
        parentY: node.widgetSyncedState.dna.value,
        parentXGen: generationFromState(self.widgetSyncedState),
        parentYGen: generationFromState(node.widgetSyncedState),
        generationMax:
          Math.max(generationMax, node.widgetSyncedState.generationMax) + 1,
        generationMin:
          Math.min(generationMin, node.widgetSyncedState.generationMin) + 1,
      });
      widget.y = self.y + self.height + 10;
    } else {
      notify("Select one Widgie to breed with");
    }
  };
  useStickableHost((event) => {
    event.stuckNodeIds.forEach((nodeId) => {
      const node = getNodeById(nodeId);
      if (node && node.type === "STAMP" && node.name === "Heart") {
        node.remove();
        const lover = currentPage.getSharedPluginData("widgies", "lover");
        const loverNode: WidgetNode | null = lover
          ? (getNodeById(lover) as WidgetNode)
          : null;
        if (loverNode) {
          spawn(loverNode);
          currentPage.setSharedPluginData("widgies", "lover", "");
        } else {
          currentPage.setSharedPluginData("widgies", "lover", widgetId);
        }
      }
    });
  });
  const rarity = determineRarityFromValue(dna.value);

  return (
    <AutoLayout
      direction="vertical"
      horizontalAlignItems="center"
      verticalAlignItems="center"
      height="hug-contents"
      cornerRadius={30}
      padding={32}
      fill="#fff"
      spacing={8}
      stroke={"#f9f9f9"}
      strokeWidth={4}
    >
      {renderValue(dna.value, rarity, { fontSize: 24 })}
      <Text {...textPropsGlobal} fontSize={12} horizontalAlignText="center">
        R {rarity.factor.toFixed(4)} / A{dna.advantage} / G{" "}
        {generationFromState({ generationMin, generationMax })}
      </Text>
      <Text {...textPropsGlobal} fontSize={10} horizontalAlignText="center">
        {rarity.absence.factor.toFixed(4)} /{" "}
        {rarity.prominence.factor.toFixed(4)} /{" "}
        {rarity.repeats.factor.toFixed(4)}
      </Text>
      <AutoLayout spacing={8} verticalAlignItems="center">
        <AutoLayout
          spacing={4}
          direction="vertical"
          horizontalAlignItems="center"
        >
          {renderValue(parentX, determineRarityFromValue(parentX), {
            fontSize: 12,
          })}
          <Text {...textPropsGlobal} fontSize={10}>
            R {determineRarityFromValue(parentX).factor.toFixed(4)} / G{" "}
            {parentXGen}
          </Text>
        </AutoLayout>
        <AutoLayout
          direction="vertical"
          horizontalAlignItems="center"
          spacing={8}
        >
          {renderPie(dna.value, rarity)}
          {owner && owner.photoUrl ? (
            <Image
              src={owner?.photoUrl}
              height={20}
              width={20}
              cornerRadius={20}
            />
          ) : owner ? (
            <Text>{owner.name}</Text>
          ) : null}
        </AutoLayout>
        <AutoLayout
          spacing={4}
          direction="vertical"
          horizontalAlignItems="center"
        >
          {renderValue(parentY, determineRarityFromValue(parentY), {
            fontSize: 12,
          })}
          <Text {...textPropsGlobal} fontSize={10}>
            R {determineRarityFromValue(parentY).factor.toFixed(4)} / G{" "}
            {parentYGen}
          </Text>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
}
widget.register(Widget);