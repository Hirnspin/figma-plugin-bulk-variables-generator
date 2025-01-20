import * as React from "react";
import * as ReactDOM from "react-dom/client";
import ISettings from "./ISettings";
import 'figma-plugin-ds/dist/figma-plugin-ds.css'
import './figma-plugin-ds-overrides.css'
import "./ui.css";

interface IAppState extends Omit<ISettings, 'customNumberEnd'> {
  isRunning: boolean,
  collections: VariableCollection[],
}

function App() {
  const [state, setState] = React.useState<IAppState>({
    isRunning: false,
    collections: [],
    selectedCollectionId: undefined,
    createNewCollection: true,
    leadingZeros: true,
    variableName: "size-$NN",
    end: 128,
    numberSteps: 8,
    start: 0,
    collectionName: "Primitive Size",
    customNumbers: false,
    customNumberStart: 50,
    customNumberSteps: 50,
    updatedDetachedAliases: false,
    hiddenFromPublishing: false,
    leadingZerosCount: 3,
    //scopes: []
  });

  const calculateLeadingZeroCount = () => (state.customNumbers ? calculatedCustomEnd : state.end).toString().length;
  //const [leadingZerosCount, setLeadingZerosCount] = React.useState<number>(calculateLeadingZeroCount());
  const calculatedCustomEnd = Math.ceil((((state.end / state.numberSteps) * state.customNumberSteps) + state.customNumberStart) / state.customNumberSteps) * state.customNumberSteps;

  React.useEffect(() => {
    window.onmessage = async (event: MessageEvent) => {
      const {
        data: { pluginMessage: { collections } },
      } = event;
      setState({ ...state, collections: collections, selectedCollectionId: (collections as VariableCollection[])[0].id });
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: "init"
        },
      },
      "*"
    );

    return () => {
      window.onmessage = null;
    };
  }, []);

  const onRun = () => {
    setState(Object.assign(state, { isRunning: true }));
    const _settings: ISettings = { ...state, customNumberEnd: calculatedCustomEnd };
    console.log('Settings before run: ', _settings);

    parent.postMessage(
      {
        pluginMessage: {
          type: "run",
          settings: _settings
        },
      },
      "*"
    );
  };

  const renderPreview = () => {
    let blocks: React.JSX.Element[] = [];

    for (let index = state.start, customIndex = state.customNumbers ? state.customNumberStart : state.start;
      index <= state.end, customIndex <= (state.customNumbers ? calculatedCustomEnd : state.end);
      index = index + state.numberSteps, customIndex = customIndex + (state.customNumbers ? state.customNumberSteps : state.numberSteps)) {
      let _nameIndex = state.customNumbers ? customIndex : index;
      blocks.push(
        <tr key={index}>
          <td>
            <div className="flex-row gap-050">
              <svg className="number-symbol"><use href="#number-symbol"></use></svg>
              <span>
                {
                  state.leadingZeros ?
                    state.variableName.replace("$NN", _nameIndex.toString().padStart(state.leadingZerosCount, "0"))
                    :
                    state.variableName.replace("$NN", _nameIndex.toString())}
              </span>
            </div>
          </td>
          <td>{index}</td>
        </tr>);
    }
    return blocks;
  }

  return (
    <main>
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" id="SvgSprite">
        <symbol viewBox="0 0 16 16" id="number-symbol">
          <path fill="currentColor" fillOpacity={.5} fillRule="evenodd" stroke="none" d="M6.276 3.002c.275.025.473.267.443.542l-.213 1.913h3.438l.223-2.003c.03-.274.278-.477.553-.452.275.025.473.267.443.542l-.213 1.913h1.55c.276 0 .5.224.5.5 0 .276-.224.5-.5.5h-1.66l-.334 3H12.5c.276 0 .5.224.5.5 0 .276-.224.5-.5.5h-2.105l-.233 2.093c-.03.274-.278.477-.553.452-.275-.025-.473-.267-.443-.542l.223-2.003H5.95l-.232 2.093c-.03.274-.278.477-.553.452-.275-.025-.474-.267-.443-.542l.222-2.003H3.5c-.276 0-.5-.224-.5-.5 0-.276.224-.5.5-.5h1.556l.333-3H3.5c-.276 0-.5-.224-.5-.5 0-.276.224-.5.5-.5h2l.223-2.003c.03-.274.278-.477.553-.452zM9.5 9.457l.333-3H6.395l-.334 3H9.5z"></path>
        </symbol>
        <symbol viewBox="0 0 12 12" id="info">
          <path fill="currentColor" fillOpacity="1" fillRule="nonzero" stroke="none" d="M6 12c3.314 0 6-2.686 6-6 0-3.314-2.686-6-6-6-3.314 0-6 2.686-6 6 0 3.314 2.686 6 6 6zm0-.667C3.054 11.333.667 8.946.667 6 .667 3.054 3.054.667 6 .667c2.946 0 5.333 2.387 5.333 5.333 0 2.946-2.387 5.333-5.333 5.333zm-.666-6h1.333v4H5.334v-4zm0-2c0-.368.298-.666.667-.666.368 0 .666.298.666.666 0 .369-.298.667-.666.667-.369 0-.667-.298-.667-.667z"></path>
        </symbol>
      </svg>
      <div className="main">
        <div className="form gap-050">
          <label className="label" htmlFor="webVariableType" id="collectionLabel">Target collection</label>
          <div className="flex-row">
            <div className="radio">
              <input id="newCollection" defaultChecked={state.createNewCollection}
                onChange={() => {
                  setState({ ...state, createNewCollection: true });
                }} type="radio" className="radio__button" value="NEW" name="collectionCreation" />
              <label htmlFor="newCollection" className="radio__label">New</label>
            </div>
            <div className="radio">
              <input id="existingCollection"
                disabled={state.collections.length <= 0}
                onChange={() => {
                  setState({ ...state, createNewCollection: false });
                }} type="radio" className="radio__button" value="EXISTING" name="collectionCreation" />
              <label htmlFor="existingCollection" className="radio__label">Existing</label>
            </div>
          </div>
          {state.createNewCollection ?
            <div className="input">
              <input
                id="collectionName"
                type="input"
                aria-labelledby="collectionLabel"
                value={state.collectionName}
                onBlur={(event) => {
                  if (!event.currentTarget.value) {
                    setState({ ...state, collectionName: "Primitive Size" });
                  }
                }}
                onChange={(event) => setState({ ...state, collectionName: event.currentTarget.value })}
                className="input__field"
                required
                placeholder="Primitive Size"
              />
            </div> :
            <div className="input">
              <select id="selectedCollectionId" aria-labelledby="collectionLabel" className="input__field"
                defaultValue={state.selectedCollectionId} onChange={(event) => {
                  setState({ ...state, selectedCollectionId: event.currentTarget.value });
                }}>
                {state.collections.map((item, index) =>
                  <option value={item.id} key={index}>{item.name}</option>
                )}
              </select>
            </div>}
          <label className="label flex-row gap-050" htmlFor="collectionQueryFilter">
            Variable name
            <i id="variableName_details" title="You can use a '/' to create sub folders. Use '$NN' to place the number."><svg width={12}><use href="#info"></use></svg></i>
          </label>
          <div className="input">
            <input
              id="variableName"
              value={state.variableName}
              onBlur={(event) => {
                const newValue = event.currentTarget.value;
                if (!newValue || !newValue.includes("$NN")) {
                  setState({ ...state, variableName: "size-$NN" });
                }
              }}
              onChange={(event) => setState({ ...state, variableName: event.currentTarget.value })}
              type="input"
              className="input__field"
              placeholder="size-$NN"
              pattern=".*(\$NN)+.*"
              required
              aria-describedby="variableName_details"
              aria-details="variableName_details"
            />
          </div>
          <div className="switch">
            <input id="customNumbers" defaultChecked={state.customNumbers}
              onChange={() => {
                setState(currentState => { return { ...state, customNumbers: !currentState.customNumbers } });
              }} type="checkbox" className="switch__toggle" value="CUSTOM" name="numberFormatInName" />
            <label htmlFor="customNumbers" className="switch__label">Use custom numbers in name</label>
          </div>
          <div className="flex-row">
            {state.customNumbers ?
              <div className="flex-column" style={{ width: '50%' }}><label className="label" htmlFor="customNumberStart">Name start</label>
                <div className="input">
                  <input
                    id="customNumberStart"
                    value={state.customNumberStart}
                    onChange={(event) => {
                      const newValue = Number.parseInt(event.currentTarget.value);
                      setState({ ...state, customNumberStart: newValue ? newValue : 0 });
                    }}
                    type="number"
                    className="input__field"
                    placeholder="0"
                    min={0}
                    max={99999}
                    required
                  />
                </div>
                <label className="label" htmlFor="customNumberSteps">Name steps</label>
                <div className="input">
                  <input
                    id="customNumberSteps"
                    value={state.customNumberSteps}
                    onChange={(event) => {
                      const newValue = Number.parseInt(event.currentTarget.value);
                      setState({ ...state, customNumberSteps: newValue ? newValue : 1 });
                    }}
                    type="number"
                    className="input__field"
                    placeholder="100"
                    min={1}
                    max={99999}
                    required
                  />
                </div>
                <label className="label" htmlFor="customNumberEnd">Name end (automatic)</label>
                <div className="input">
                  <input
                    id="customNumberEnd"
                    value={calculatedCustomEnd}
                    readOnly
                    type="number"
                    className="input__field"
                  />
                </div></div> : <></>}
            <div className="flex-column" style={{ width: '50%' }}>
              <label className="label" htmlFor="start">Value start</label>
              <div className="input">
                <input
                  id="start"
                  value={state.start}
                  onChange={(event) => {
                    const newValue = Number.parseInt(event.currentTarget.value);
                    setState({ ...state, start: newValue ? newValue : 0 });
                  }}
                  type="number"
                  className="input__field"
                  placeholder="0"
                  min={0}
                  max={99999}
                  required
                />
              </div>
              <label className="label" htmlFor="numberSteps">Value steps</label>
              <div className="input">
                <input
                  id="numberSteps"
                  value={state.numberSteps}
                  onChange={(event) => {
                    const newValue = Number.parseInt(event.currentTarget.value);
                    setState({ ...state, numberSteps: newValue ? newValue : 1 });
                  }}
                  type="number"
                  className="input__field"
                  placeholder="16"
                  min={1}
                  max={99999}
                  required
                />
              </div>
              <label className="label" htmlFor="end">Value end</label>
              <div className="input">
                <input
                  id="end"
                  value={state.end}
                  onChange={(event) => {
                    const newValue = Number.parseInt(event.currentTarget.value);
                    setState({ ...state, end: newValue && newValue > state.start + 1 ? newValue : state.start + 1 });
                  }}
                  type="number"
                  className="input__field"
                  placeholder="0"
                  min={state.start + 1}
                  max={999999}
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex-column">
            <div className="checkbox">
              <input defaultChecked={state.leadingZeros} required
                onChange={(event) => {
                  const isChecked = event.currentTarget.checked;
                  setState({ ...state, leadingZeros: isChecked, leadingZerosCount: isChecked ? state.leadingZerosCount : calculateLeadingZeroCount() });
                }}
                id="leadingZeros" type="checkbox" className="checkbox__box" />
              <label htmlFor="leadingZeros" id="leadingZerosLabel" className="checkbox__label">Add leading zeros</label>
              <div className="input">
                <input id="leadingZerosCount" value={state.leadingZerosCount} className="input__field" required={state.leadingZeros} readOnly={!state.leadingZeros}
                  onChange={(event) => {
                    const newValue = Number.parseInt(event.currentTarget.value);
                    setState({ ...state, leadingZerosCount: newValue });
                  }}
                  aria-labelledby="leadingZerosLabel"
                  type="number" />
              </div>
            </div>
            <div className="checkbox">
              <input defaultChecked={state.updatedDetachedAliases} required
                onChange={(event) => {
                  setState({ ...state, updatedDetachedAliases: event.currentTarget.checked });
                }}
                id="updatedDetachedAliases" type="checkbox" className="checkbox__box" />
              <label htmlFor="updatedDetachedAliases" className="checkbox__label" title="Apply variables to detached alias variables with the same name.">Apply detached</label>
            </div>
            <div className="checkbox">
              <input defaultChecked={state.hiddenFromPublishing} required
                onChange={(event) => {
                  setState({ ...state, hiddenFromPublishing: event.currentTarget.checked });
                }}
                id="hideFromPublishing" type="checkbox" className="checkbox__box" />
              <label htmlFor="hideFromPublishing" className="checkbox__label">Hide from publishing</label>
            </div>
          </div>
        </div>
        <div className="preview-container">
          <table>
            <thead>
              <tr>
                <th colSpan={2}>Preview</th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {renderPreview()}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bottom-bar">
        <button id="run" className="button button--primary" disabled={state.isRunning} onClick={onRun}>
          {state.isRunning ? <i className="icon icon--spinner icon--spin icon-white"></i> : "Generate..."}
        </button>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("react-page")!).render(<App />);
