import {
  EPOCH,
  Code,
  generateCode,
  generateCodeFromParentCodes,
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

const initial = generateCode();
// initial.value = initial.value.replace(/./g, "9");
// initial.rarity = determineRarityFromValue(initial.value);

const fills = [
  "#E6312E",
  "#E6722E",
  "#E6B82E",
  "#D7E62E",
  "#8AE62E",
  "#47E62E",
  "#2EE65C",
  "#2EE6A0",
  "#2EE6E6",
  "#2EA3E6",
  "#2E5CE6",
  "#442EE6",
  "#8A2EE6",
  "#CE2EE6",
  "#E62EB8",
  "#E62E75",
  "#E62E31",
];

const fillFromCode = (code: string) => {
  return fills[parseInt(code, 16)];
};

const textPropsGlobal: TextProps = {
  fontFamily: "Roboto Mono",
  fontWeight: "bold",
};

function renderPie(
  code: Code,
  owner: User | null,
  di: number,
  codeHover = false,
  frameProps: Partial<FrameProps> = {}
) {
  const groups: { fill: string; start: number; end: number }[] = [];
  const valueLength = code.pairs.length * 2;
  const step = (Math.PI * 2) / valueLength;
  let pos = Math.PI * -0.5;
  code.pairs.forEach((pair, i) => {
    if (pair.notable) {
      groups.push({
        fill: fillFromCode(pair.value.charAt(0)),
        start: pos,
        end: pos + step,
      });
      groups.push({
        fill: fillFromCode(pair.value.charAt(1)),
        start: pos + step,
        end: pos + step * 2,
      });
    }
    pos += step * 2;
  });
  const inset = 0.3;
  const insetSize = di * inset;
  return (
    <Frame width={di} height={di} {...frameProps} cornerRadius={di}>
      {groups.map(({ fill, start, end }, i) => (
        <Ellipse
          key={i}
          arcData={{
            startingAngle: start,
            endingAngle: end,
            innerRadius: inset,
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
      {owner && owner.photoUrl ? (
        <Image
          src={owner.photoUrl}
          height={insetSize}
          width={insetSize}
          cornerRadius={insetSize}
          x={{
            type: "left-right",
            leftOffset: (di - insetSize) / 2,
            rightOffset: (di - insetSize) / 2,
          }}
          y={{
            type: "top-bottom",
            topOffset: (di - insetSize) / 2,
            bottomOffset: (di - insetSize) / 2,
          }}
        />
      ) : null}
      {codeHover ? (
        <AutoLayout
          height={insetSize}
          fill="#000"
          hoverStyle={{ opacity: 0 }}
          verticalAlignItems="center"
          horizontalAlignItems="center"
          width={insetSize}
          cornerRadius={insetSize}
          x={{
            type: "left-right",
            leftOffset: (di - insetSize) / 2,
            rightOffset: (di - insetSize) / 2,
          }}
          y={{
            type: "top-bottom",
            topOffset: (di - insetSize) / 2,
            bottomOffset: (di - insetSize) / 2,
          }}
        >
          <Text
            fill="#FFF"
            {...textPropsGlobal}
            fontSize={insetSize * 0.55}
            fontWeight={"bold"}
          >
            {code.score}
          </Text>
        </AutoLayout>
      ) : null}
    </Frame>
  );
}

function renderValue(code: Code, textProps: TextProps = {}) {
  const textPropsAll: TextProps = {
    ...textPropsGlobal,
    ...textProps,
  };
  return (
    <AutoLayout>
      {code.value === EPOCH ? (
        <AutoLayout
          padding={{
            top: 4,
            bottom: 4,
            left: 8,
            right: 8,
          }}
          fill={"#000"}
        >
          <Text {...textPropsAll} fill={"#666"}>
            {EPOCH}
          </Text>
        </AutoLayout>
      ) : (
        code.pairs.map((pair, i) => (
          <AutoLayout key={i}>
            {pair.value.split("").map((char, j) => (
              <AutoLayout
                key={j}
                padding={{
                  top: 4,
                  bottom: 4,
                  left: j ? 0 : i ? 4 : 8,
                  right: j ? (i === code.pairs.length - 1 ? 8 : 4) : 0,
                }}
                fill={pair.notable ? fillFromCode(char) : "#000"}
              >
                <Text {...textPropsAll} fill={pair.notable ? "#FFF" : "#666"}>
                  {char}
                </Text>
              </AutoLayout>
            ))}
          </AutoLayout>
        ))
      )}
    </AutoLayout>
  );
}

const generationFromState = (state: { [k: string]: number }) =>
  `${state.generationMin}-${state.generationMax}`;

function Widget() {
  const [pieView, setPieView] = useSyncedState("pieView", false);
  const [owner, setOwner] = useSyncedState<User | null>("owner", null);
  const [code] = useSyncedState<Code>("code", initial);
  const [parentX] = useSyncedState("parentX", EPOCH);
  const [parentY] = useSyncedState("parentY", EPOCH);
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
    if (node && node.id !== widgetId) {
      const widget = self.cloneWidget({
        code: generateCodeFromParentCodes(code, node.widgetSyncedState.code),
        parentX: code.value,
        parentY: node.widgetSyncedState.code.value,
        parentXGen: generationFromState(self.widgetSyncedState),
        parentYGen: generationFromState(node.widgetSyncedState),
        pieView: false,
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
  const { complete } = code;
  return (
    <AutoLayout
      direction="vertical"
      horizontalAlignItems="center"
      verticalAlignItems="center"
      height="hug-contents"
      padding={12}
    >
      {pieView ? (
        <AutoLayout onClick={() => setPieView(false)}>
          {renderPie(code, owner, 100, true, {
            fill: "#ccc",
            stroke: complete ? "#000" : undefined,
            strokeWidth: 4,
          })}
        </AutoLayout>
      ) : (
        <AutoLayout
          stroke="#000"
          strokeWidth={complete ? 4 : 0}
          onClick={() => setPieView(true)}
          tooltip={`${code.score} (D${code.doubles} S${code.repeats} U${
            code.uniques
          }) / ${code.advantage}x / G ${generationFromState({
            generationMin,
            generationMax,
          })}`}
        >
          {renderValue(code, { fontSize: 24 })}
        </AutoLayout>
      )}
    </AutoLayout>
  );
}
widget.register(Widget);
