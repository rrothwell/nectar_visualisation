// Load the file and interpret as Javascript;
// prepare the jason by pre-pending with 'allocations=' and post-pending with ';' 
load("/Users/developer/Google Drive/NeCTAR NCR002/NeCTAR Dev Ops Shared/Langstroth subproject/chart2/allocations_pretty3.js");

// Structure is an array of item objects with fields:
// project_name: string
// for_2: string (e.g. 02)
// for_4: string (e.g. 0202)
// for_6: string (e.g. 020203)
// institution: string
// use_case: string
// instance_quota: float
// core_quota: float

var allocationsTree = {};

var allocationCount = allocations.length;
for (var allocationIndex = 0; allocationIndex < allocationCount; allocationIndex++) 
{
	var allocationCode2 = allocations[allocationIndex].for_2;
	if (!allocationsTree[allocationCode2])
	{
		allocationsTree[allocationCode2] = {};
	}
	var allocationCode4 = allocations[allocationIndex].for_4;
	if (!allocationsTree[allocationCode2][allocationCode4])
	{
		allocationsTree[allocationCode2][allocationCode4] = {};
	}
	var allocationCode6 = allocations[allocationIndex].for_6;
	if (!allocationsTree[allocationCode2][allocationCode4][allocationCode6])
	{
		allocationsTree[allocationCode2][allocationCode4][allocationCode6] = [];
	}
	var allocation = {};
	allocation.projectName = allocations[allocationIndex].project_name;
	allocation.institution = allocations[allocationIndex].institution;
	allocation.useCase = allocations[allocationIndex].use_case;
	allocation.instanceQuota = allocations[allocationIndex].instance_quota;
	allocation.coreQuota = allocations[allocationIndex].core_quota;
	allocationsTree[allocationCode2][allocationCode4][allocationCode6].push(allocation);
}

var for2Count = 0
var for4Count = 0
var for6Count = 0

printf("{\n\t\"name\":\"allocations\",\n\t\"children\": \n\t[");
var delimiter0 = "";
for (var code2 in allocationsTree) 
{
	if (allocationsTree.hasOwnProperty(code2)) 
	{
		printf(delimiter0 + "\n\t{\n\t\t\"name\":\"%s\",\n\t\t\"children\": \n\t\t[", code2);
		var delimiter1 = "";
		for (var code4 in allocationsTree[code2]) 
		{
			if (allocationsTree[code2].hasOwnProperty(code4)) 
			{
				printf(delimiter1 + "\n\t\t\t{\n\t\t\t\t\"name\":\"%s\",\n\t\t\t\t\"children\": \n\t\t\t\t[", code4);
				var delimiter2 = "";
				for (var code6 in allocationsTree[code2][code4]) 
				{
					if (allocationsTree[code2][code4].hasOwnProperty(code6)) 
					{
						printf(delimiter2 + "\n\t\t\t\t\t{\n\t\t\t\t\t\t\"name\":\"%s\",\n\t\t\t\t\t\t\"children\": \n\t\t\t\t\t\t[", code6);
						var delimiter3 = "";
						var allocations = allocationsTree[code2][code4][code6];
						var allocationCount = allocations.length;
						for (var allocationIndex = 0; allocationIndex < allocationCount; allocationIndex++) 
						{
							var allocation = allocations[allocationIndex];
							//printf("\n\t\t\t{\n\t\t\t\t\"name\":\"%s\", \"institution\": \"%s\", \"use_case\": \"%s\", \"instance_quota\": %s, \"core_quota\": %s}", 
							//	allocation.useCase,
							//printf(delimiter3 + "\n\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t\"name\":\"%s\", \"institution\": \"%s\", \"instance_quota\": %s, \"core_quota\": %s, \"size\": %s\n\t\t\t\t\t\t\t}", 
							//	allocation.projectName, 
							//	allocation.institution,
							//	allocation.instanceQuota,
							//	allocation.coreQuota,
							//	allocation.coreQuota);
							//printf(delimiter3 + "\n\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t\"name\":\"%s\", \"size\": %s\n\t\t\t\t\t\t\t}", 
							//	allocation.projectName, 
							//	allocation.instanceQuota);
							printf(delimiter3 + "\n\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t\"name\":\"%s\", \"instanceQuota\": %s, \"coreQuota\": %s\n\t\t\t\t\t\t\t}", 
								allocation.projectName, 
								allocation.instanceQuota,
								allocation.coreQuota);
							delimiter3 = ",";
						}
						printf("\n\t\t\t\t\t\t]\n\t\t\t\t\t}");
						for6Count++;
					}
					delimiter2 = ",";
				}
				printf("\n\t\t\t\t]\n\t\t\t}");
				for4Count++;
			}
			delimiter1 = ",";
		}
		printf("\n\t\t]\n\t}");
		for2Count++;
	}
	delimiter0 = ",";
}
printf("\n\t]\n}\n");

// printf("// FOR2 count: %s\n", for2Count + "");
// printf("// FOR4 count: %s\n", for4Count + "");
// printf("// FOR6 count: %s\n", for6Count + "");


//var allocationCount = allocations.length;
//for (var allocationIndex = 0; allocationIndex < allocationCount; allocationIndex++) 
//{
//	//println(allocations[allocationIndex].project_name);
//	printf("{\n\t\"name\":\"%s\",\n\t\"children\": \n\t{\n\t\t\"name\":\"%s\",\n\t\t\"children\": \n\t\t{\n\t\t\t\"name\":\"%s\", \n\t\t\t\"children\": \n\t\t\t{\n\t\t\t\t\"name\":\"%s\",\n\t\t\t\t\"instance_quota\":\"%s\"\n\t\t\t}\n\t\t}\n\t}\n}", 
//		allocations[allocationIndex].for_2,
//		allocations[allocationIndex].for_4,
//		allocations[allocationIndex].for_6,
//		allocations[allocationIndex].project_name,
//		allocations[allocationIndex].instance_quota);
//}