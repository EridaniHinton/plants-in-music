// One shared tree. Change parent/children here to change both page diagrams.
window.PLANT_TREE = {
  id: "embryophytes", name: "Embryophytes", showOnMain: true, children: [
    { id: "bryophytes", name: "Bryophytes", showOnMain: true, children: [
      { id: "bryophyta", name: "Bryophyta", rank: "division", page: "families/bryophyta.html", showOnMain: true, children: [] }
    ]},
    { id: "tracheophytes", name: "Tracheophytes", showOnMain: true, children: [] }
  ]
};
