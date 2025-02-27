var manageWorkgroup = angular.module('manageWorkgroup', []);

manageWorkgroup.controller('workgroupController', ['$http', '$document', '$scope', function ($http, $document, $scope) {
    var vm = this;

    // Data Variables
    vm.workgroups = [];
    vm.currentMembers = [];
    vm.availableIdentities = [];
	vm.membersToAdd = [];
	vm.membersToRemove = [];
    vm.searchText = "";
    vm.memberSearchText = "";

    // Display Controls
    vm.showDetails = false;
    vm.selectedWorkgroup = null;

    // Pagination Controls
    vm.pageSize = 5;
    vm.currentPage = 0;
    vm.totalPages = 0;
    vm.identityCurrentPage = 0;
    vm.identitytotalPages = 0;

	// Search DropDown 
	vm.searchIdentityText = "";
    vm.showDropdown = false;

    // REST Base URL
    const REST_BASE_URL = PluginHelper.getPluginRestUrl("manageWorkgroupPlugin");

	// Fetch Workgroups
	function fetchWorkgroups() {
    var url = REST_BASE_URL + "/workgroup";
    $http.get(url, { headers: { "X-XSRF-TOKEN": PluginHelper.getCsrfToken() } })
        .then(function (response) {
			vm.totalItems = response.data.workgroupNames.length;
			vm.totalPages = Math.ceil(vm.totalItems / vm.pageSize);
			vm.startIndex = vm.currentPage * vm.pageSize;
			vm.endIndex = Math.min(vm.startIndex + vm.pageSize, vm.totalItems);
			vm.workgroups = response.data.workgroupNames.map((name, index) => ({
			workgroupNames: name,
			workgroupDescriptions: response.data.workgroupDescriptions[index] || '',
		}));
			vm.selectAllMembers = false;

        })
        .catch(function (error) {
            console.error('Error fetching workgroups:', error);
            console.log('Failed to load workgroup details.');
        });
	}

    vm.nextPage = function () {
        if (vm.currentPage < vm.totalPages - 1) {
            vm.currentPage++;
			vm.totalItems = response.data.workgroupNames.length;
			vm.totalPages = Math.ceil(vm.totalItems / vm.pageSize);
			vm.startIndex = vm.currentPage * vm.pageSize;
			vm.endIndex = Math.min(vm.startIndex + vm.pageSize, vm.totalItems);
        }
    };

    vm.prevPage = function () {
        if (vm.currentPage > 0) {
            vm.currentPage--;
			vm.totalItems = response.data.workgroupNames.length;
			vm.totalPages = Math.ceil(vm.totalItems / vm.pageSize);
			vm.startIndex = vm.currentPage * vm.pageSize;
			vm.endIndex = Math.min(vm.startIndex + vm.pageSize, vm.totalItems);      
		}
    };

    vm.goToFirstPage = function () {
        vm.currentPage = 0;
		vm.totalItems = response.data.workgroupNames.length;
		vm.totalPages = Math.ceil(vm.totalItems / vm.pageSize);
		vm.startIndex = vm.currentPage * vm.pageSize;
		vm.endIndex = Math.min(vm.startIndex + vm.pageSize, vm.totalItems);
    };

    vm.goToLastPage = function () {
        vm.currentPage = vm.totalPages - 1;
		vm.totalItems = response.data.workgroupNames.length;
		vm.totalPages = Math.ceil(vm.totalItems / vm.pageSize);
		vm.startIndex = vm.currentPage * vm.pageSize;
		vm.endIndex = Math.min(vm.startIndex + vm.pageSize, vm.totalItems);  
	};
	
	// Update Pagination for members
	vm.identityPreviousPage = function () {
        if (vm.identityCurrentPage > 0) {
            vm.identityCurrentPage--;
        }
    };

    vm.identityNextPage = function () {
        if (vm.identityCurrentPage < vm.identitytotalPages - 1) {
            vm.identityCurrentPage++;
        }
    };

    // Select Workgroup
    vm.selectWorkgroup = function (workgroup) {
        vm.selectedWorkgroup = workgroup;
        vm.showDetails = true;
        fetchMembers();
    };

	// Select All Members(Checkbox)
	vm.toggleAllMembers = function() {
		angular.forEach(vm.currentMembers, function(member) {
			member.selected = vm.selectAllMembers;
		});
		$timeout(function() {}, 0); 
	};

    // Fetch Members
    function fetchMembers() {
        if (!vm.selectedWorkgroup) return;
        var membersUrl = `${REST_BASE_URL}/identity/${vm.selectedWorkgroup}/remove`;
        $http.get(membersUrl)
            .then(function (response) {
                vm.currentMembers = response.data.map(identity => ({
                    name: identity.name,
                    firstName: identity.firstName,
                    lastName: identity.lastName,
                    selected: false
                }));
				vm.identitytotalPages = Math.ceil(vm.currentMembers.length / vm.pageSize);
               vm.identityCurrentPage = 0;
            })
            .catch(function (error) {
                console.error('Error fetching members:', error);
            });
			 var availableUrl = `${REST_BASE_URL}/identity/${vm.selectedWorkgroup}/add`;
        $http.get(availableUrl)
            .then(function (response) {
                vm.availableIdentities = response.data.map(identity => ({ name: identity.name }));
            })
            .catch(function (error) {
                console.error('Error fetching available identities:', error);
            });
    }
	
	// Remove Selected Members
    vm.removeSelectedMembers = function () {
        var selectedMembers = vm.currentMembers.filter(member => member.selected);
        selectedMembers.forEach(function (member) {
			if (!vm.membersToAdd.includes(member.name)) {
				vm.membersToRemove.push(member.name);
			} else {
				vm.membersToAdd = vm.membersToAdd.filter(member => member !== name);
			}
        });
        vm.currentMembers = vm.currentMembers.filter(member => !member.selected);
		vm.selectAllMembers = false;
    };

    // Add Member
    vm.addMember = function () {
        if (vm.selectedNewMember) {
			vm.currentMembers.push({ name: vm.selectedNewMember.name, selected: false });
            vm.availableIdentities = vm.availableIdentities.filter(identity => identity.name !== vm.selectedNewMember.name);
			vm.membersToAdd.push(vm.selectedNewMember.name);
			vm.membersToRemove = vm.membersToRemove.filter(name => name !== vm.selectedNewMember.name); 
            vm.selectedNewMember = null; 
			vm.searchIdentityText = ""; 
			
        }
    };

    // Perform Identity Operation
    function addOrRemoveIdentity(operation, identity) {
        if (!vm.selectedWorkgroup || !identity) return;

        var url = REST_BASE_URL + "/updateMembers";
        var requestData = {
            workGroup: vm.selectedWorkgroup,
            operation: operation,
            identity: identity
        };

        $http.post(url, requestData)
            .then(function () {
                console.log(`Identity ${identity} successfully ${operation === 'add' ? 'added to' : 'removed from'} ${vm.selectedWorkgroup}.`);
            })
            .catch(function (error) {
                console.error('Error performing operation:', error);
                console.log('Error: Unable to perform the operation.');
            });
    }

    // Go Back to Workgroup List
    vm.goBack = function () {
        vm.showDetails = false;
        vm.selectedWorkgroup = null;
		vm.memberSearchText = "";
		vm.searchText = "";
		vm.membersToAdd = [];
		vm.membersToRemove = [];
		vm.searchIdentityText = "";
		fetchWorkgroups();
		vm.searchIdentityText = "";
		vm.showDropdown = false;
		vm.selectAllMembers = false;
    };
	
	//save changes
	vm.saveChanges = function () {
		vm.membersToAdd.forEach(function (name) {
            addOrRemoveIdentity("add", name);	
        });
		vm.membersToRemove.forEach(function (name) {
            addOrRemoveIdentity("remove", name);	
        });
		
		vm.showDetails = false;
        vm.selectedWorkgroup = null;
		vm.memberSearchText = "";
		vm.searchText = "";
		vm.membersToAdd = [];
		vm.membersToRemove = [];
		vm.searchIdentityText = "";
		vm.showDropdown = false;
		vm.selectAllMembers = false;
	}
	
	// Refresh Button
	vm.refreshData = function (){
		vm.currentPage = 0;
		vm.searchText = "";
		vm.totalItems = vm.workgroups.workgroupNames.length;
        vm.totalPages = Math.ceil(vm.totalItems / vm.pageSize);
		vm.startIndex = vm.currentPage * vm.pageSize;
		vm.endIndex = Math.min(vm.startIndex + vm.pageSize, vm.totalItems);
	}
	
	// Sorting Data
	vm.sortBy = function(column) {
		console.log("column ",column);
	  if (vm.sortColumn === column) {
		vm.reverse = !vm.reverse; 
	  } else {
		vm.sortColumn = column;
		vm.reverse = false; 
	  }
	};
	
	// Search Functionality
	vm.onSearch = function (name) {
    if(name==="workgroup"){
        vm.filteredWorkgroups = vm.workgroups.filter(function (workgroup) {
            return !vm.searchText || workgroup.workgroupNames.toLowerCase().includes(vm.searchText.toLowerCase());
        });
        vm.totalPages = Math.ceil(vm.filteredWorkgroups.length / vm.pageSize);
        vm.currentPage = 0;
		vm.startIndex = vm.currentPage * vm.pageSize;
		vm.endIndex = Math.min(vm.startIndex + vm.pageSize, vm.totalItems);
	}
	else if(name==="identity"){
		vm.filteredIdentities = vm.currentMembers.filter(function (identity) {
            return !vm.memberSearchText || identity.name.toLowerCase().includes(vm.memberSearchText.toLowerCase());
        });
        vm.identitytotalPages = Math.ceil(vm.filteredIdentities.length / vm.pageSize);
        vm.identityCurrentPage = 0;
	}
	};
	
    // Toggle dropdown on input click
    vm.toggleDropdown = function ($event) {
        vm.showDropdown = !vm.showDropdown;
        $event.stopPropagation(); 
    };

    // Select identity & close dropdown
    vm.selectIdentity = function (identity) {
        vm.searchIdentityText = identity.name; 
        vm.showDropdown = false; 
    };

	// Clear search on double-click
	vm.clearSearch = function () {
		vm.showDropdown = true; 
	};
	
	// Detect outside clicks to close dropdown
	$document.on("click", function (event) {
		if (!angular.element(event.target).closest(".searchDropdown, .searchInput").length) {
			$scope.$applyAsync(function () { 
				vm.showDropdown = false; 
			});
		}
	});

	// Function to Select Identity
    vm.selectIdentity = function(identity) {
            vm.selectedNewMember = identity;
            vm.searchIdentityText = identity.name;
            vm.showDropdown = false;
        };
 
    // Fetch Initial Data
    fetchWorkgroups();
}]);
 