export default interface ISettings {
  selectedCollectionId?: string;
  createNewCollection: boolean;
  variableName: string;
  leadingZeros: boolean;
  leadingZerosCount: number;
  numberSteps: number;
  start: number;
  end: number;
  collectionName: string;
  customNumbers: boolean;
  customNumberSteps: number;
  customNumberStart: number;
  customNumberEnd: number;
  updatedDetachedAliases: boolean;
  hiddenFromPublishing: boolean;
  //scopes: VariableScope[];
}
