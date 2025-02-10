import ISettings from "./ISettings";

figma.showUI(__html__, {
  height: 620,
  width: 512,
  themeColors: true,
});

type DetachedAliasVariableResult = {
  variable: Variable;
  modeId: string;
  sourceVariable: Variable;
};

function getDetachedAliasVariables(
  variables: Variable[]
): Array<DetachedAliasVariableResult> {
  const result: DetachedAliasVariableResult[] = [];

  variables.forEach(async (variable) => {
    const collection = await figma.variables.getVariableCollectionByIdAsync(
      variable.variableCollectionId
    );

    collection?.modes.forEach(async (mode) => {
      const value: VariableValue = variable.valuesByMode[mode.modeId];

      if ((value as VariableAlias).type === "VARIABLE_ALIAS") {
        const sourceVariable = await figma.variables.getVariableByIdAsync(
          (value as VariableAlias).id
        );

        const sourceVariableCollectionId = sourceVariable?.variableCollectionId;

        if (sourceVariableCollectionId) {
          const sourceCollection =
            await figma.variables.getVariableCollectionByIdAsync(
              sourceVariable?.variableCollectionId
            );

          if (
            !sourceCollection ||
            !sourceCollection?.variableIds.includes(sourceVariable.id)
          ) {
            result.push({ variable, modeId: mode.modeId, sourceVariable });
          }
        }

        return sourceVariable === null;
      }
    });
  });

  return result;
}

async function process(_settings: ISettings) {
  let collection = _settings.createNewCollection
    ? figma.variables.createVariableCollection(_settings.collectionName)
    : await figma.variables.getVariableCollectionByIdAsync(
        _settings.selectedCollectionId!
      );
  if (collection) {
    let variables: Variable[] = [];
    let detachedAliasVariables: DetachedAliasVariableResult[] = [];

    variables = await figma.variables.getLocalVariablesAsync("FLOAT");
    detachedAliasVariables = getDetachedAliasVariables(variables);

    if (detachedAliasVariables.length > 0) {
      console.log(
        "Detached alias variables found:",
        detachedAliasVariables.map((x) => x.variable.name).join(", ")
      );
    }

    for (
      let index = _settings.start,
        customIndex = _settings.customNumbers
          ? _settings.customNumberStart
          : _settings.start;
      index <= _settings.end,
        customIndex <=
          (_settings.customNumbers ? _settings.customNumberEnd : _settings.end);
      index = index + _settings.numberSteps,
        customIndex =
          customIndex +
          (_settings.customNumbers
            ? _settings.customNumberSteps
            : _settings.numberSteps)
    ) {
      let _nameIndex = _settings.customNumbers ? customIndex : index;
      let name = _settings.variableName.replace(
        "$NN",
        _settings.leadingZeros
          ? _nameIndex.toString().padStart(_settings.leadingZerosCount, "0")
          : _nameIndex.toString()
      );

      let createVariable = true;

      if (!_settings.createNewCollection && variables.length > 0) {
        createVariable = !variables.find((v) => v.name === name);
      }

      if (createVariable) {
        const _var = figma.variables.createVariable(name, collection, "FLOAT");

        console.info(`Variable "${name}" created successfully!`);
        _var.setValueForMode(collection.defaultModeId, index);
        //_var.scopes = _settings.scopes;
        _var.hiddenFromPublishing = _settings.hiddenFromPublishing;

        if (
          _settings.updatedDetachedAliases &&
          detachedAliasVariables.length > 0
        ) {
          detachedAliasVariables
            .filter(
              (x) =>
                x.sourceVariable.name === _var.name && x.variable.id !== _var.id
            )
            .forEach((x) => {
              console.log("Update detached alias variable.", x.variable.name);
              x.variable.setValueForMode(
                x.modeId,
                figma.variables.createVariableAlias(_var)
              );
            });
        }
      } else {
        console.warn();
        `Variable "${name}" was not created!`;
      }
    }
  } else {
    console.error(
      `Error while processing. Either the collection with the id "${_settings.selectedCollectionId}" was not found, or the collection with the name "${_settings.collectionName}" could not be created!`
    );
  }
}

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "run":
      await process(msg.settings);
      figma.closePlugin();
      break;
    case "init":
      const collections = (
        await figma.variables.getLocalVariableCollectionsAsync()
      )
        .map((c) => {
          return { id: c.id, name: c.name };
        })
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      figma.ui.postMessage({
        collections: collections,
      });
      break;
  }
};
